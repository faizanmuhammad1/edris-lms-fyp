import { Resend } from "resend";
import { env } from "./env";
export const resend = new Resend(env.RESEND_API_KEY);

export const DEFAULT_EMAIL_FROM = "Edris LMS <onboarding@resend.dev>";

type SendEmailPayload = Parameters<typeof resend.emails.send>[0];

/**
 * Send a single email and throw if Resend reports a failure.
 * resend.emails.send() resolves with `{ data, error }` on API errors instead
 * of throwing, so a bare try/catch would treat failures as success.
 */
export async function sendEmailOrThrow(payload: SendEmailPayload) {
  const { data, error } = await resend.emails.send(payload);
  if (error) {
    throw new Error(`Resend error (${error.name}): ${error.message}`);
  }
  return data;
}
