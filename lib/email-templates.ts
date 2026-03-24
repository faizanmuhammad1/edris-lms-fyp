import { getServerBaseUrl } from "./base-url";

/**
 * Branded email templates for Edris LMS. Resend only; inline styles; responsive.
 * Logo: public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png
 * Colors: primary #5d866c, accent #8fb89a / #6b9b7a
 */

const BRAND = {
  primary: "#5d866c",
  primaryHover: "#8fb89a",
  accent: "#6b9b7a",
  muted: "#6b7280",
  white: "#ffffff",
  dark: "#111827",
} as const;

const LOGO_PATH = "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";

/** Base URL for absolute links in emails (logo, confirm, unsubscribe). */
export function getEmailBaseUrl(): string {
  return getServerBaseUrl();
}

export function getLogoUrl(): string {
  return `${getEmailBaseUrl()}${LOGO_PATH}`;
}

/** Shared wrapper: header (logo), body slot, footer (unsubscribe + Edris LMS). */
function emailWrapper(options: {
  bodyHtml: string;
  unsubscribeUrl?: string;
  preview?: boolean;
  title?: string;
}): string {
  const { bodyHtml, unsubscribeUrl, preview, title = "Edris LMS" } = options;
  const logoUrl = getLogoUrl();
  const baseUrl = getEmailBaseUrl();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f3f4f6;color:${BRAND.dark};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
          ${preview ? `<tr><td style="padding:8px 16px;background:#fef3c7;color:#92400e;font-size:14px;text-align:center;border-radius:8px 8px 0 0;">Preview — not sent to recipients</td></tr>` : ""}
          <tr>
            <td style="background:${BRAND.white};border-radius:${preview ? "0" : "8px"} 8px 8px 8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background:${BRAND.primary};padding:20px 24px;text-align:center;">
                    <a href="${baseUrl}" target="_blank" rel="noopener" style="display:inline-block;">
                      <img src="${logoUrl}" alt="Edris LMS" width="120" height="40" style="display:block;max-height:40px;width:auto;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px;font-size:16px;line-height:1.6;">
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:${BRAND.muted};">
                    <p style="margin:0 0 8px 0;">Edris LMS — Empowering learners worldwide.</p>
                    ${unsubscribeUrl ? `<p style="margin:0;"><a href="${escapeHtml(unsubscribeUrl)}" style="color:${BRAND.primary};text-decoration:underline;">Unsubscribe from marketing</a></p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Confirm subscription: CTA button with confirm link. */
export function confirmSubscriptionEmail(confirmUrl: string): string {
  const body = `
    <p style="margin:0 0 16px 0;">Thanks for subscribing. Click below to confirm your email and start receiving updates from Edris.</p>
    <p style="margin:0 0 24px 0;">
      <a href="${escapeHtml(confirmUrl)}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 24px;background:${BRAND.primary};color:${BRAND.white};text-decoration:none;font-weight:600;border-radius:8px;">Confirm subscription</a>
    </p>
    <p style="margin:0;font-size:14px;color:${BRAND.muted};">If you didn't request this, you can safely ignore this email.</p>
  `;
  return emailWrapper({
    bodyHtml: body,
    title: "Confirm your subscription — Edris LMS",
  });
}

/** Campaign: rich body + optional per-recipient unsubscribe URL. */
export function campaignEmail(bodyHtml: string, unsubscribeUrl?: string): string {
  return emailWrapper({
    bodyHtml: `<div class="prose">${bodyHtml}</div>`,
    unsubscribeUrl,
    title: "Edris LMS",
  });
}

/** Preview: same as campaign with banner. */
export function previewCampaignEmail(bodyHtml: string): string {
  return emailWrapper({
    bodyHtml: `<div class="prose">${bodyHtml}</div>`,
    preview: true,
    title: "Preview — Edris LMS",
  });
}

/** Unsubscribe confirmation (sent after they click unsub). */
export function unsubscribeConfirmationEmail(): string {
  const baseUrl = getEmailBaseUrl();
  const body = `
    <p style="margin:0 0 16px 0;">You've been unsubscribed and won't receive further marketing emails from us.</p>
    <p style="margin:0;"><a href="${baseUrl}" style="color:${BRAND.primary};text-decoration:underline;">Back to Edris LMS</a></p>
  `;
  return emailWrapper({
    bodyHtml: body,
    title: "Unsubscribed — Edris LMS",
  });
}

export function courseCompletionCongratsEmail(params: {
  studentName: string;
  courseName: string;
  certificateUrl: string;
}): string {
  const { studentName, courseName, certificateUrl } = params;
  const safeStudent = escapeHtml(studentName || "Learner");
  const safeCourse = escapeHtml(courseName);
  const safeCertUrl = escapeHtml(certificateUrl);

  const body = `
    <p style="margin:0 0 10px 0;font-size:14px;color:${BRAND.accent};text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">
      Course completed
    </p>
    <h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.2;color:${BRAND.dark};">
      Congratulations, ${safeStudent}!
    </h1>
    <p style="margin:0 0 18px 0;color:${BRAND.muted};">
      You have successfully completed <strong>${safeCourse}</strong>. Your certificate is now being prepared.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px 0;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
      <tr>
        <td style="padding:14px 16px;">
          <p style="margin:0 0 6px 0;font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;">Course</p>
          <p style="margin:0;font-size:16px;color:${BRAND.dark};font-weight:600;">${safeCourse}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px 0;">
      <a href="${safeCertUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 22px;background:${BRAND.primary};color:${BRAND.white};text-decoration:none;font-weight:700;border-radius:8px;">
        View Certificate
      </a>
    </p>

    <p style="margin:0;font-size:13px;color:${BRAND.muted};">
      We are also anchoring your certificate on the blockchain. You will receive another email when it is fully verified.
    </p>
  `;

  return emailWrapper({
    bodyHtml: body,
    title: "Course completed — Edris LMS",
  });
}

export function certificateIssuedEmail(params: {
  studentName: string;
  courseName: string;
  certificateId: string;
  verificationUrl: string;
  txUrl?: string | null;
  network?: string | null;
}): string {
  const {
    studentName,
    courseName,
    certificateId,
    verificationUrl,
    txUrl,
    network,
  } = params;

  const safeStudent = escapeHtml(studentName || "Learner");
  const safeCourse = escapeHtml(courseName);
  const safeCertificateId = escapeHtml(certificateId);
  const safeVerificationUrl = escapeHtml(verificationUrl);
  const safeNetwork = escapeHtml(network || "Polygon Amoy");
  const safeTxUrl = txUrl ? escapeHtml(txUrl) : null;

  const txBlock = safeTxUrl
    ? `<p style="margin:0;">
         <a href="${safeTxUrl}" target="_blank" rel="noopener" style="color:${BRAND.primary};text-decoration:underline;">
           View blockchain transaction
         </a>
       </p>`
    : `<p style="margin:0;">Transaction link unavailable at the moment.</p>`;

  const body = `
    <p style="margin:0 0 10px 0;font-size:14px;color:${BRAND.accent};text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">
      Certificate issued
    </p>
    <h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.2;color:${BRAND.dark};">
      Your certificate is blockchain verified
    </h1>
    <p style="margin:0 0 18px 0;color:${BRAND.muted};">
      Great work, <strong>${safeStudent}</strong>. Your certificate for <strong>${safeCourse}</strong> has been successfully issued.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px 0;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
      <tr>
        <td style="padding:14px 16px;">
          <p style="margin:0 0 6px 0;font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;">Certificate ID</p>
          <p style="margin:0 0 12px 0;font-size:15px;color:${BRAND.dark};font-weight:600;">${safeCertificateId}</p>
          <p style="margin:0 0 6px 0;font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;">Network</p>
          <p style="margin:0;font-size:15px;color:${BRAND.dark};font-weight:600;">${safeNetwork}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px 0;">
      <a href="${safeVerificationUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 22px;background:${BRAND.primary};color:${BRAND.white};text-decoration:none;font-weight:700;border-radius:8px;">
        Verify Certificate
      </a>
    </p>

    <div style="font-size:13px;color:${BRAND.muted};line-height:1.6;">
      ${txBlock}
    </div>
  `;

  return emailWrapper({
    bodyHtml: body,
    title: "Certificate issued — Edris LMS",
  });
}
