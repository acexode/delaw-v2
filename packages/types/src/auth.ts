// Auth domain types — shared between the Node API and the web client.
// Enum literals are taken verbatim from spec §3.3.

export type OrgType =
  | "LAW_FIRM"
  | "CHAMBERS"
  | "CORPORATE"
  | "JUDICIARY"
  | "SOLO";

export type SubscriptionPlan =
  | "FREE"
  | "SOLO"
  | "PROFESSIONAL"
  | "FIRM"
  | "ENTERPRISE";

export type UserRole =
  | "PARTNER"
  | "SENIOR_ASSOCIATE"
  | "ASSOCIATE"
  | "PARALEGAL"
  | "ADMIN"
  | "BILLING"
  | "CLIENT"
  | "JUDGE";

/** The user shape returned by the API (apps/api `publicUser`). */
export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organisationId: string;
  onboardingComplete: boolean;
  totpEnabled: boolean;
}

/** Organisation summary returned on registration. */
export interface AuthOrganisation {
  id: string;
  name: string;
  slug: string;
  type: OrgType;
  plan: SubscriptionPlan;
}

// --- Requests ---

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  organisationName: string;
  organisationType: OrgType;
  plan: SubscriptionPlan;
  country: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface TotpChallengeRequest {
  challengeToken: string;
  code: string;
}

// --- Responses ---

export interface RegisterResponse {
  accessToken: string;
  user: PublicUser;
  organisation: AuthOrganisation;
}

/** Successful credential login — a session was issued. */
export interface LoginSuccessResponse {
  accessToken: string;
  user: PublicUser;
  totpRequired?: false;
}

/** Credentials were valid but 2FA is enabled — finish via /totp/challenge. */
export interface LoginChallengeResponse {
  totpRequired: true;
  challengeToken: string;
}

export type LoginResponse = LoginSuccessResponse | LoginChallengeResponse;

export interface SessionResponse {
  accessToken: string;
  user: PublicUser;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface SuccessResponse {
  success: boolean;
}

export interface VerifyEmailResponse {
  success: boolean;
  verified: boolean;
}

/** Error body shape from the API's central error handler. */
export interface ApiErrorBody {
  error: string;
  message: string;
  statusCode: number;
}

/** Decoded JWT access-token payload (signed by the API, spec §8.1). */
export interface AccessTokenClaims {
  sub: string;
  orgId: string;
  role: UserRole;
  email: string;
  iat: number;
  exp: number;
}
