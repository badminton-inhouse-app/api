import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { bookings, courts } from '../database/schema';
import { and, eq, ne } from 'drizzle-orm';
import { RedisService } from '../redis/redis.service';
import { BookingCenterDto } from './dto/booking-center.dto';
import { QueueService } from '../queue/queue.service';
import { CreateBookingPaymentSessionDto } from './dto/create-booking-payment-session.dto';
import { PaymentsService } from '../payments/payments.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingCompletedEvent } from './events/booking-completed.event';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';

@Injectable()
export class BookingsService {
  constructor(
    @Inject() private readonly configService: ConfigService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => QueueService)) // 👈 use forwardRef here if needed
    private readonly queueService: QueueService,
    private readonly paymentsService: PaymentsService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async findById(id: string) {
    return await this.db.query.bookings.findFirst({
      where: (bookings, { eq }) => eq(bookings.id, id),
    });
  }

  async updateStatus(
    bookingId: string,
    userId: string,
    newStatus: 'CANCELLED' | 'COMPLETED' | 'PENDING'
  ) {
    const booking = await this.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new Error('You are not authorized to cancel this booking');
    }

    try {
      const result = await this.db
        .update(bookings)
        .set({ status: newStatus })
        .where(eq(bookings.id, bookingId))
        .returning();

      if (result.length === 0) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating booking status:', error);
      return false;
    }
  }

  async updateStatusByPaymentSessionId(
    paymentSessionId: string,
    newStatus: 'CANCELLED' | 'COMPLETED' | 'PENDING'
  ) {
    const paymentSession = await this.db.query.paymentSessions.findFirst({
      where: (paymentSessions, { eq }) =>
        eq(paymentSessions.paymentSessionId, paymentSessionId),
    });

    if (!paymentSession) {
      throw new Error('Payment session not found');
    }

    const booking = await this.db.query.bookings.findFirst({
      where: (bookings, { eq }) => eq(bookings.id, paymentSession.bookingId),
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    try {
      const result = await this.db
        .update(bookings)
        .set({ status: newStatus })
        .where(eq(bookings.id, booking.id))
        .returning();

      if (result.length === 0) {
        return false;
      }

      if (newStatus === 'COMPLETED') {
        // Emit event for payment completed
        this.eventEmitter.emit(
          'booking.completed',
          new BookingCompletedEvent(booking.id, booking.userId)
        );
      }

      return true;
    } catch (error) {
      console.error('Error updating booking status:', error);
      return false;
    }
  }

  // This method checks if the requested time is valid for booking.
  // parameter: startTime in milliseconds
  // parameter: endTime in milliseconds
  // return: boolean
  checkIfTimeValid(startTime: number, endTime: number) {
    /// Check if the start time is greater than or equal end time
    if (startTime >= endTime) {
      return false;
    }

    const startDT = new Date(startTime);
    const endDT = new Date(endTime);
    const minimumHours = 2;
    // Check if the requested start time is in break period (from 11AM to 12PM)
    if (startDT.getHours() === 11 || endDT.getHours() === 11) {
      return false;
    }

    // Check if the requested start time is in between 7AM and 11AM
    if (
      startDT.getHours() < 7 ||
      startDT.getHours() >= 23 ||
      endDT.getHours() < 7 ||
      endDT.getHours() >= 23
    ) {
      return false;
    }

    // Check if the requested booking hours is less than 2 hours
    if (endDT.getHours() - startDT.getHours() < minimumHours) {
      return false;
    }
  }

  async getAvailableCourtsByCenterId(centerId: string) {
    return await this.db
      .select()
      .from(courts)
      .where(
        and(eq(courts.centerId, centerId), eq(courts.status, 'AVAILABLE'))
      );
  }

  async pessimisticLock(
    centerId: string,
    courtId: string,
    userId: string,
    startTime: number
  ) {
    // Generate a unique lock key by combine the centerId, courtId, and start time
    const lockKey = `center:${centerId}:court:${courtId}:${startTime}:lock`;
    // Generate a unique lock value by combining the userId and current timestamp
    const lockValue = `${userId}-${Date.now()}`;
    const lockAcquired = await this.redisService.acquireLock(
      lockKey,
      lockValue,
      3000
    );

    if (!lockAcquired) {
      return null;
    }

    return {
      lockKey,
      lockValue,
    };
  }

  async getOverlapBooking(courtId: string, starTime: number, endTime: number) {
    const startTimeD = new Date(starTime);
    const endTimeD = new Date(endTime);
    return await this.db.query.bookings.findFirst({
      where: (bookings, { eq, lt, gt, and }) =>
        and(
          eq(bookings.courtId, courtId),
          ne(bookings.status, 'CANCELLED'),
          lt(bookings.startTime, endTimeD),
          gt(bookings.endTime, startTimeD)
        ),
    });
  }

  async booking(bookingCenterDto: BookingCenterDto, userId: string) {
    const { centerId, startTime, endTime } = bookingCenterDto;

    if (this.checkIfTimeValid(startTime, endTime) === false) {
      throw new Error('Invalid time. Please try again.');
    }

    // Check if any courts is available in the center
    const availableCourts = await this.getAvailableCourtsByCenterId(centerId);

    if (availableCourts.length === 0) {
      throw new Error('No courts available in this center.');
    }
    let result: any[] = [];
    // Iterate through available courts and try to acquire a lock
    for (let i = 0; i < availableCourts.length; i++) {
      const court = availableCourts[i];
      const courtId = court.id;

      // Check overlap booking for the court
      const overlapBooking = await this.getOverlapBooking(
        courtId,
        startTime,
        endTime
      );

      // Skip this court if it is overlapping with another booking
      if (overlapBooking) {
        continue;
      }

      // Acquire a lock on the court
      const lockAcquired = await this.pessimisticLock(
        centerId,
        court.id,
        userId,
        startTime
      );

      // If lock is not acquired, continue to the next court
      if (!lockAcquired) {
        continue;
      }

      // If lock is acquired, proceed with booking and break the loop, remove the lock from Redis
      const { lockKey, lockValue } = lockAcquired;
      const startTimeDT = new Date(startTime);
      const endTimeDT = new Date(endTime);

      try {
        result = await this.db
          .insert(bookings)
          .values({
            courtId: courtId,
            userId: userId,
            startTime: startTimeDT,
            endTime: endTimeDT,
            status: 'PENDING',
          })
          .returning();

        if (result.length === 0) {
          throw new Error('Failed to book court.');
        }

        // Add the booking to the queue for cancellation after 30 minutes without payment
        const delayMs = 30 * 60 * 1000; // 30 minutes in milliseconds
        await this.queueService.addCancelJob(result[0].id, delayMs);
        break;
      } catch (err: any) {
        console.log('Error booking court: ', err);
        throw new Error('Failed to book court.');
      } finally {
        await this.redisService.releaseLock(lockKey, lockValue);
      }
    }
    return result;
  }

  async createBookingPaymentSession(
    userId: string,
    bookingId: string,
    body: CreateBookingPaymentSessionDto
  ) {
    const booking = await this.db.query.bookings.findFirst({
      where: (bookings, { eq }) => eq(bookings.id, bookingId),
    });

    if (!booking) {
      throw new Error('Booking not found');
    }
    if (booking.userId !== userId) {
      throw new Error('You are not authorized to create payment session');
    }
    if (booking.status !== 'PENDING') {
      throw new Error('Booking is not pending');
    }

    const { paymentMethod } = body;
    const amount = 100000; // Replace with actual amount calculate from formula

    try {
      return await this.paymentsService.createSession(
        userId,
        bookingId,
        amount,
        paymentMethod
      );
    } catch (err: any) {
      console.log('Error creating payment session:', err.message);
      throw new Error('Failed to create payment session.');
    }
  }

  generateSignature(secret: string, jsonData: any) {
    return crypto.createHmac('sha256', secret).update(jsonData).digest('hex');
  }

  async getBookingVerifyQRDataURL(userId: string, bookingId: string) {
    const qrCodeSignatureSecret = this.configService.get<string>(
      'BOOKING_QR_CODE_SIGNATURE_SECRET'
    );
    if (!qrCodeSignatureSecret) {
      throw new Error('QR Code signature secret is not configured.');
    }

    const qrCodeData = {
      bookingId,
      userId,
    };

    const jsonData = JSON.stringify(qrCodeData);
    const signature = this.generateSignature(qrCodeSignatureSecret, jsonData);

    console.log('Signature:', signature);

    const url = `https://www.localhost:3000/api/bookings/verify?sig=${signature}&bookingId=${bookingId}&userId=${userId}`;
    // const url = 'https://www.google.com';

    const qrImgDataURL = await QRCode.toDataURL(url);

    return qrImgDataURL;
  }

  async verifyBookingBySig(
    userId: string,
    bookingId: string,
    receivedSignature: string
  ) {
    const qrCodeSignatureSecret = this.configService.get<string>(
      'BOOKING_QR_CODE_SIGNATURE_SECRET'
    );
    if (!qrCodeSignatureSecret) {
      throw new Error('QR Code signature secret is not configured.');
    }

    const jsonData = JSON.stringify({
      bookingId,
      userId,
    });

    const expectedSignature = this.generateSignature(
      qrCodeSignatureSecret,
      jsonData
    );

    const bufferExpected = Buffer.from(expectedSignature, 'hex');
    const bufferReceived = Buffer.from(receivedSignature, 'hex');

    if (bufferExpected.length !== bufferReceived.length) {
      return null;
    }

    //Use `timingSafeEqual` to prevent timing attacks
    const isValid = crypto.timingSafeEqual(bufferExpected, bufferReceived);

    if (!isValid) {
      return null;
    }

    const booking = await this.db.query.bookings.findFirst({
      where: (bookings, { eq }) => eq(bookings.id, bookingId),
    });

    if (!booking) {
      return null;
    }

    const court = await this.db.query.courts.findFirst({
      where: (courts, { eq }) => eq(courts.id, booking.courtId),
    });

    if (!court) {
      return null;
    }

    const center = await this.db.query.centers.findFirst({
      where: (centers, { eq }) => eq(centers.id, court.centerId),
    });

    if (!center) {
      return null;
    }

    if (booking.userId !== userId) {
      return null;
    }

    return {
      center: {
        address: center.address,
        district: center.district,
        city: center.city,
      },
      court_no: court.courtNo,
      start_time: moment(booking.startTime).format('HH:mm DD-MM-YYYY'),
      end_time: moment(booking.endTime).format('HH:mm DD-MM-YYYY'),
      status: booking.status,
    };
  }
}
