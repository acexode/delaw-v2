import { z } from "zod";

// Request body schemas for all auth routes (spec §4.2). Exported for reuse —
// these will move to packages/types later and be shared with the frontend.

// org_type enum values (spec §3.3).
export const orgTypeSchema = z.enum([
  "LAW_FIRM",
  "CHAMBERS",
  "CORPORATE",
  "JUDICIARY",
  "SOLO",
]);

// subscription_plan enum values (spec §3.3).
export const subscriptionPlanSchema = z.enum([
  "FREE",
  "SOLO",
  "PROFESSIONAL",
  "FIRM",
  "ENTERPRISE",
]);

const emailSchema = z.string().trim().toLowerCase().email("Invalid email");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);
const totpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, "TOTP code must be 6 digits");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(1, "Full name is required").max(200),
  organisationName: z
    .string()
    .trim()
    .min(1, "Organisation name is required")
    .max(200),
  organisationType: orgTypeSchema.default("LAW_FIRM"),
  plan: subscriptionPlanSchema.default("FREE"),
  country: z.string().trim().length(2).toUpperCase().default("NG"),
  phone: z.string().trim().max(40).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

export const totpVerifySchema = z.object({
  code: totpCodeSchema,
});

export const totpDisableSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const totpChallengeSchema = z.object({
  challengeToken: z.string().min(1, "Challenge token is required"),
  code: totpCodeSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type TotpVerifyInput = z.infer<typeof totpVerifySchema>;
export type TotpDisableInput = z.infer<typeof totpDisableSchema>;
export type TotpChallengeInput = z.infer<typeof totpChallengeSchema>;
