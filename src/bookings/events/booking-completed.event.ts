export class BookingCompletedEvent {
  constructor(
    public readonly bookingId: string,
    public readonly userId: string
  ) {}
}
