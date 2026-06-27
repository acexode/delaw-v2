import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  orgTypeEnum,
  planStatusEnum,
  subscriptionPlanEnum,
  userRoleEnum,
} from "./enums";
import { createdAt, deletedAt, updatedAt, uuidPk } from "./_shared";

// Spec §3.2 — organisations, users, subscriptions.

export const organisations = pgTable("organisations", {
  id: uuidPk(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  type: orgTypeEnum("type").notNull(),
  plan: subscriptionPlanEnum("plan").notNull(),
  planStatus: planStatusEnum("plan_status").notNull(),
  planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
  country: text("country").notNull().default("NG"),
  logoUrl: text("logo_url"),
  settings: jsonb("settings").notNull().default({}),
  aiCreditsUsed: integer("ai_credits_used").notNull().default(0),
  aiCreditsQuota: integer("ai_credits_quota").notNull().default(100),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: deletedAt(),
});

export const users = pgTable("users", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  displayName: text("display_name"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull(),
  barNumber: text("bar_number"),
  specialisations: text("specialisations").array(),
  jurisdictions: text("jurisdictions").array(),
  isActive: boolean("is_active").notNull().default(true),
  totpSecret: text("totp_secret"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  passwordResetToken: text("password_reset_token"),
  passwordResetAt: timestamp("password_reset_at", { withTimezone: true }),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  preferences: jsonb("preferences").notNull().default({}),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: deletedAt(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .unique()
    .notNull()
    .references(() => organisations.id),
  plan: subscriptionPlanEnum("plan").notNull(),
  status: planStatusEnum("status").notNull(),
  paystackSubId: text("paystack_sub_id"),
  stripeSubId: text("stripe_sub_id"),
  seatsIncluded: integer("seats_included").notNull().default(1),
  seatsUsed: integer("seats_used").notNull().default(1),
  aiCreditsMo: integer("ai_credits_mo").notNull().default(100),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
