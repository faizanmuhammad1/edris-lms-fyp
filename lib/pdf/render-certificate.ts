import "server-only";

import { chromium } from "playwright";

export async function renderCertificateToPdf(
  uniqueId: string
): Promise<Buffer> {
  // Use app-facing base URL for HTML rendering.
  // Do NOT use INTERNAL_WEBHOOK_URL here, because it may point to a protected
  // production endpoint and return 403 in local/dev rendering.
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const url = `${baseUrl}/certificates/render/${encodeURIComponent(uniqueId)}`;

  const browser = await chromium.launch({
    // Required in many sandboxed/container environments.
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1400, height: 900 },
    });

    const resp = await page.goto(url, { waitUntil: "networkidle" });
    const status = resp?.status() ?? 0;
    if (status < 200 || status >= 300) {
      throw new Error(`Certificate render page failed: HTTP ${status}`);
    }
    await page.emulateMedia({ media: "print" });

    const pdfBytes = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
    });

    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}

