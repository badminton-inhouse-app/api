import {
  forwardRef,
  Inject,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private bookingCancelQueue: Queue;
  private bookingCancelWorker: Worker;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      console.error('REDIS_URL is not defined in environment variables.');
      return;
    }

    const redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.bookingCancelQueue = new Queue('booking-cancel', {
      connection: redis,
    });

    this.bookingCancelWorker = new Worker(
      'booking-cancel',
      async (job: Job) => {
        const { bookingId } = job.data;
        await this.handleCancelBooking(bookingId);
      },
      { connection: redis }
    );
  }

  async addCancelJob(bookingId: string, delayMs: number = 20 * 60 * 1000) {
    await this.bookingCancelQueue.add(
      'cancelBooking',
      { bookingId },
      { delay: delayMs }
    );
  }

  private async handleCancelBooking(bookingId: string) {
    const booking = await this.bookingsService.findById(bookingId);

    if (booking && booking.status === 'PENDING') {
      const result = await this.bookingsService.updateStatus(
        bookingId,
        booking.userId,
        'CANCELLED'
      );
      if (result) {
        console.log(`Booking ${bookingId} was successfully canceled.`);
      } else {
        console.error(`Failed to cancel booking ${bookingId}.`);
      }
    }
  }

  async onModuleDestroy() {
    await this.bookingCancelWorker.close();
    await this.bookingCancelQueue.close();
  }
}
