import { z } from "zod";

// Zod schemas for the auth forms (React Hook Form resolvers).

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const personalDetailsSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required").max(200),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    dialCode: z.string().min(1),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    barNumber: z.string().trim().max(60).optional().or(z.literal("")),
    stateOfPractice: z.string().min(1, "Select your state of practice"),
    acceptedTerms: z.literal(true, {
      message: "You must accept the Terms to continue",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type PersonalDetailsValues = z.infer<typeof personalDetailsSchema>;

export const organisationSchema = z.object({
  organisationName: z
    .string()
    .trim()
    .min(1, "Organisation name is required")
    .max(200),
  organisationType: z.enum([
    "LAW_FIRM",
    "CHAMBERS",
    "CORPORATE",
    "JUDICIARY",
    "SOLO",
  ]),
  lawyerCount: z.string().min(1),
  practiceAreas: z.array(z.string()),
  jurisdiction: z.string().length(2),
});
export type OrganisationValues = z.infer<typeof organisationSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
