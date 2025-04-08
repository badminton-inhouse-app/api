// src/queue/booking-cancel-queue.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private queue: Queue;
  private worker: Worker;

  constructor(
    private readonly configService: ConfigService,
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

    this.addQueueHandler('booking-cancel', redis);
  }

  addQueueHandler(name: string, redis: IORedis) {
    this.queue = new Queue(name, { connection: redis });

    this.worker = new Worker(
      name,
      async (job: Job) => {
        const { bookingId } = job.data;
        await this.handleCancelBooking(bookingId);
      },
      { connection: redis }
    );
  }

  async addCancelJob(bookingId: string, delayMs: number = 20 * 60 * 1000) {
    await this.queue.add('booking-cancel', { bookingId }, { delay: delayMs });
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
    await this.worker.close();
    await this.queue.close();
  }
}
