export enum CourtStatus {
  AVAILABLE = 'AVAILABLE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum UserPointType {
  BOOKING = 'BOOKING',
  ADDTIONAL_SPENDING = 'ADDTIONAL_SPENDING',
}

export enum PaymentMethod {
  MOMO = 'MOMO',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  VISA = 'VISA',
  MASTER_CARD = 'MASTER_CARD',
  PAYPAL = 'PAYPAL',
  INTERNET_BANKING = 'INTERNET_BANKING',
  STRIPE = 'STRIPE',
}
