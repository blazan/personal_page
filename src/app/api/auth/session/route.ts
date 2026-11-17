import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/auth/session
 *
 * Reports whether the caller holds a valid admin session. The admin UI uses
 * this to decide between the login form and the dashboard.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    authenticated: Boolean(session),
    username: session?.sub ?? null,
  });
}
