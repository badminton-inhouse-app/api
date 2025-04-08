import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { bookings } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class BookingsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

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
}
