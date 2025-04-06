import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  integer,
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
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});
