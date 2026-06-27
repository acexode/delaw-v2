import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

// TOTP per RFC 6238 (spec §8.1) — compatible with Google Authenticator / Authy.
// otplib v13 functional API defaults to NobleCrypto + ScureBase32 plugins.
const ISSUER = "DeLaw";
const EPOCH_TOLERANCE_SECONDS = 30; // accept ±1 time step for clock drift

export function generateTotpSecret(): string {
  return generateSecret();
}

export function buildKeyUri(accountEmail: string, secret: string): string {
  return generateURI({ issuer: ISSUER, label: accountEmail, secret });
}

export async function buildQrDataUrl(keyUri: string): Promise<string> {
  return QRCode.toDataURL(keyUri);
}

export async function verifyTotpCode(
  token: string,
  secret: string,
): Promise<boolean> {
  try {
    const result = await verify({
      secret,
      token,
      epochTolerance: EPOCH_TOLERANCE_SECONDS,
    });
    return result.valid;
  } catch {
    return false;
  }
}
