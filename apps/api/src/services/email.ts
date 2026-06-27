import { Resend } from "resend";

import { env } from "../config/env";

// When RESEND_API_KEY is unset (local dev) emails are logged to the console
// instead of sent — including the OTP/token so flows can be tested without a UI.
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// DeLaw design tokens (spec §14.3).
const NAVY = "#0A0F1E";
const SURFACE = "#1C2333";
const GOLD = "#C9A84C";
const TEXT_PRIMARY = "#F0F4FF";
const TEXT_SECONDARY = "#8B95A8";

function layout(heading: string, body: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:${NAVY};font-family:Inter,Arial,sans-serif;color:${TEXT_PRIMARY};padding:32px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:${SURFACE};border-radius:12px;padding:32px">
          <tr><td>
            <div style="font-size:20px;font-weight:700;color:${GOLD};margin-bottom:8px">DeLaw</div>
            <div style="font-size:12px;color:${TEXT_SECONDARY};margin-bottom:24px">African Law. Intelligently Practiced.</div>
            <h1 style="font-size:18px;margin:0 0 16px">${heading}</h1>
            ${body}
          </td></tr>
        </table>
        <div style="font-size:11px;color:${TEXT_SECONDARY};margin-top:16px">© DeLaw — this is an automated message.</div>
      </td></tr>
    </table>
  </body>
</html>`;
}

async function dispatch(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.log(`[email:dev] to=${to} subject="${subject}"`);
    return;
  }
  await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
}

export async function sendVerificationEmail(
  email: string,
  otp: string,
): Promise<void> {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.log(`[email:dev] verification OTP for ${email}: ${otp}`);
  }
  const html = layout(
    "Verify your email",
    `<p style="color:${TEXT_SECONDARY};line-height:1.6">Enter this code to verify your DeLaw account:</p>
     <div style="font-family:'JetBrains Mono',monospace;font-size:32px;letter-spacing:8px;font-weight:700;color:${GOLD};margin:16px 0">${otp}</div>
     <p style="color:${TEXT_SECONDARY};font-size:13px">This code expires in 15 minutes.</p>`,
  );
  await dispatch(email, "Verify your DeLaw email", html);
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const link = `${env.WEB_ORIGIN}/reset-password?token=${token}`;
  if (!resend) {
    // eslint-disable-next-line no-console
    console.log(`[email:dev] password reset link for ${email}: ${link}`);
  }
  const html = layout(
    "Reset your password",
    `<p style="color:${TEXT_SECONDARY};line-height:1.6">We received a request to reset your DeLaw password. This link is valid for 1 hour and can be used once.</p>
     <p style="margin:24px 0"><a href="${link}" style="background:${GOLD};color:${NAVY};text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Reset password</a></p>
     <p style="color:${TEXT_SECONDARY};font-size:13px">If you didn't request this, you can safely ignore this email.</p>`,
  );
  await dispatch(email, "Reset your DeLaw password", html);
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
): Promise<void> {
  const html = layout(
    `Welcome to DeLaw, ${name}`,
    `<p style="color:${TEXT_SECONDARY};line-height:1.6">Your firm workspace is ready. Sign in to set up your matters, run legal research, and invite your team.</p>
     <p style="margin:24px 0"><a href="${env.WEB_ORIGIN}" style="background:${GOLD};color:${NAVY};text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Open DeLaw</a></p>`,
  );
  await dispatch(email, "Welcome to DeLaw", html);
}
