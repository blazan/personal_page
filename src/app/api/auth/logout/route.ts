import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth";

/**
 * POST /api/auth/logout
 *
 * Clears the session cookie. POST rather than GET so a stray link or prefetch
 * cannot sign the admin out.
 */
export async function POST() {
  await endSession();
  return NextResponse.json({ ok: true });
}
