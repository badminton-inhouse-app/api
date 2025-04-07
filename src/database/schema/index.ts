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

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const user_profiles = pgTable('user_profiles', {
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
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const courts = pgTable('courts', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  centerId: uuid('center_id').references(() => centers.id),
  courtNo: integer('court_no').notNull().unique(),
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
    .references(() => courts.id),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  status: bookingStatusEnum('status').default('PENDING').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  customerId: integer('customer_id').notNull(),
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
});
