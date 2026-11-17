import { NextResponse } from "next/server";

import { listMessages } from "@/lib/db";
import { guard } from "@/lib/api-helpers";

/**
 * GET /api/admin/messages
 *
 * Returns the contact-form inbox, newest first.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  return NextResponse.json({ messages: listMessages() });
}
