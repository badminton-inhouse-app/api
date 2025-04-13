export class PaymentCompletedEvent {
  constructor(public readonly paymentSessionId: string) {}
}
