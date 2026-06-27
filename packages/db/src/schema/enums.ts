import { pgEnum } from "drizzle-orm/pg-core";

// PostgreSQL enums — spec §3.3 (authoritative). Values are verbatim from the
// §3.3 enum table, which takes precedence over the §3.2 inline comments.

export const orgTypeEnum = pgEnum("org_type", [
  "LAW_FIRM",
  "CHAMBERS",
  "CORPORATE",
  "JUDICIARY",
  "SOLO",
]);

export const userRoleEnum = pgEnum("user_role", [
  "PARTNER",
  "SENIOR_ASSOCIATE",
  "ASSOCIATE",
  "PARALEGAL",
  "ADMIN",
  "BILLING",
  "CLIENT",
  "JUDGE",
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "FREE",
  "SOLO",
  "PROFESSIONAL",
  "FIRM",
  "ENTERPRISE",
]);

export const planStatusEnum = pgEnum("plan_status", [
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELLED",
  "EXPIRED",
]);

export const matterTypeEnum = pgEnum("matter_type", [
  "LITIGATION",
  "ADVISORY",
  "TRANSACTION",
  "COMPLIANCE",
  "ARBITRATION",
]);

export const matterStatusEnum = pgEnum("matter_status", [
  "OPEN",
  "IN_COURT",
  "NEGOTIATION",
  "SETTLEMENT",
  "CLOSED",
  "ARCHIVED",
]);

export const billingTypeEnum = pgEnum("billing_type", [
  "HOURLY",
  "FIXED",
  "CONTINGENCY",
  "RETAINER",
  "PRO_BONO",
]);

export const docTypeEnum = pgEnum("doc_type", [
  "PLEADING",
  "CONTRACT",
  "BRIEF",
  "MEMO",
  "TEMPLATE",
  "RESEARCH",
  "GENERATED",
  "UPLOADED",
]);

export const docStatusEnum = pgEnum("doc_status", [
  "DRAFT",
  "REVIEW",
  "FINAL",
  "ARCHIVED",
]);

export const contentTypeEnum = pgEnum("content_type", [
  "CASE_LAW",
  "STATUTE",
  "REGULATION",
  "COURT_RULE",
  "TREATY",
  "PRACTICE_DIRECTION",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "SENT",
  "PAID",
  "OVERDUE",
  "CANCELLED",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "CANCELLED",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const clientTypeEnum = pgEnum("client_type", [
  "INDIVIDUAL",
  "CORPORATE",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "HEARING",
  "FILING",
  "ADJOURNMENT",
  "DEADLINE",
  "JUDGMENT",
  "NOTE",
]);
