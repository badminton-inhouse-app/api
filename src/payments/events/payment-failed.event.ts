export class PaymentFailedEvent {
  constructor(public readonly paymentSessionId: string) {}
}
