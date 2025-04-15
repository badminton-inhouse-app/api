import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  integer,
  varchar,
  decimal,
  date,
  jsonb,
} from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE']);

export const experienceEnum = pgEnum('experience', [
  'U_1_M', // 0-1 month
  'U_3_M', // 0-3 months
  'U_6_M', // 3-6 months
  'U_1_YEAR', // 6-12 months
  'U_2_YEARS', // 1-2 years
  'U_3_YEARS', // 2-3 years
  'O_3_YEARS', // 3+ years
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'MOMO',
  'BANK_TRANSFER',
  'CASH',
  'VISA',
  'MASTER_CARD',
  'PAYPAL',
  'INTERNET_BANKING',
  'STRIPE',
]);

export const courtStatusEnum = pgEnum('court_status', [
  'AVAILABLE',
  'MAINTENANCE',
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'PENDING',
  'COMPLETED',
  'CANCELLED',
]);

export const userPointTypeEnum = pgEnum('user_point_type', [
  'BOOKING', //by hours per booking time
  'ADDTIONAL_SPENDING', //like spending on additional services: drink, food, etc
  'REDEEM', //points deducted when redeem voucher
]);

export const discountTypeEnum = pgEnum('discount_type', [
  'FIXED', //discount is fixed amount, eg: discount 20000 VND
  'PERCENTAGE', //discount is percentage, eg: discount 10% on total bill
]);

export const voucherStatusEnum = pgEnum('voucher_status', [
  'CLAIMED', //voucher is claimed by user
  'USED', //voucher is used by user
  'EXPIRED', //voucher is expired
]);

export const voucherTypeEnum = pgEnum('voucher_type', [
  'TOTAL_BOOKING_PRICE',
  'PER_BOOKING_HOUR_PRICE',
  'ADD_FREE_HOURS', //meaning if user book 2 hours, he/she will only need to pay for 1 hour
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  name: text('name').notNull(),
  userId: uuid('user_id').references(() => users.id),
  gender: genderEnum('gender').notNull().default('MALE'),
  phoneNo: text('phone'),
  avatar: text('avatar'),
  birthday: timestamp('birthday'),
  experience: experienceEnum('experience').notNull().default('U_1_M'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const centers = pgTable('centers', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  address: text('address').notNull().default(''),
  district: text('district').notNull().default(''),
  city: text('city').notNull().default(''),
  phoneNo: text('phone_no').notNull().default(''),
  lat: decimal('lat', { precision: 9, scale: 6 }).notNull().default('0'),
  lng: decimal('lng', { precision: 9, scale: 6 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const courts = pgTable('courts', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  centerId: uuid('center_id')
    .references(() => centers.id)
    .notNull(),
  courtNo: integer('court_no').notNull(),
  status: courtStatusEnum('status').default('AVAILABLE').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  courtId: uuid('court_id')
    .notNull()
    .references(() => courts.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: bookingStatusEnum('status').default('PENDING').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  userId: uuid('user_id').references(() => users.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  dueDate: date('due_date').notNull(),
  issuedDate: date('issued_date').notNull().defaultNow(),
  paidDate: date('paid_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  invoiceNumber: varchar('invoice_number', { length: 50 })
    .notNull()
    .references(() => invoices.invoiceNumber),
  paymentMethod: paymentMethodEnum('payment_method').notNull(), // e.g., visa, paypal, momo
  transactionId: varchar('transaction_id', { length: 100 }).notNull(), // External payment gateway txn id
  amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).notNull(),
  paidAt: timestamp('paid_at', { withTimezone: false }).notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('completed'), // completed, pending, failed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const paymentSessions = pgTable('payment_sessions', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  bookingId: uuid('booking_id')
    .references(() => bookings.id)
    .notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  paymentSessionId: varchar('payment_session_id').unique(),
  status: bookingStatusEnum('status').default('PENDING').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const userPoints = pgTable('user_points', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id').references(() => users.id),
  points: integer('points').notNull().default(0),
  type: userPointTypeEnum('type').notNull().default('BOOKING'),
  metadata: jsonb('metadata').default({}), // e.g., bookingId, additionalServiceId, etc.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const vouchers = pgTable('vouchers', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  name: text('name').notNull().default(''),
  desc: text('name').notNull().default(''),
  type: voucherTypeEnum('type').notNull().default('TOTAL_BOOKING_PRICE'),
  requiredPoints: integer('required_points').notNull().default(0),
  discountType: discountTypeEnum('discount_type').notNull().default('FIXED'),
  discountValue: decimal('discount_value').notNull().default('0'),
  validFrom: timestamp('valid_from').notNull(),
  validTo: timestamp('valid_to').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const userVouchers = pgTable('user_vouchers', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id').references(() => users.id),
  voucherId: uuid('voucher_id').references(() => vouchers.id),
  status: voucherStatusEnum('status').default('CLAIMED').notNull(),
  claimedAt: timestamp('claimed_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});
