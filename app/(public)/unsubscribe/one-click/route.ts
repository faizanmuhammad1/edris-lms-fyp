import { NextRequest, NextResponse } from "next/server";
import { unsubscribeByEmail } from "@/app/actions/newsletter";

/**
 * RFC 8058 one-click unsubscribe. Mail clients POST
 * "List-Unsubscribe=One-Click" to the URL from the campaign's
 * List-Unsubscribe header; the email and signed token are in the query.
 */
export async function POST(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email") ?? "";
  const token = request.nextUrl.searchParams.get("token") ?? "";

  const result = await unsubscribeByEmail(email, token);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

/** Opening the header URL in a browser goes to the confirmation page instead. */
export function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/unsubscribe";
  return NextResponse.redirect(url);
}
