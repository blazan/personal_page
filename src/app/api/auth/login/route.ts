import { NextResponse } from "next/server";

import { startSession, verifyCredentials } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { asObject, readJsonBody, requireString, ValidationError } from "@/lib/validation";

/**
 * POST /api/auth/login
 *
 * Exchanges a username/password pair for an HTTP-only session cookie.
 *
 * Brute-force protection: five attempts per IP per 15 minutes. Failed attempts
 * return the same generic message regardless of whether the username or the
 * password was wrong, so the response cannot be used to enumerate accounts.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} minute(s).`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      },
    );
  }

  try {
    const body = asObject(await readJsonBody(request));
    const username = requireString(body.username, "Username", { max: 100 });
    const password = requireString(body.password, "Password", { max: 200 });

    if (!verifyCredentials(username, password)) {
      // Deliberately vague, and delayed slightly to flatten timing differences.
      await new Promise((resolve) => setTimeout(resolve, 350));
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    await startSession(username);
    return NextResponse.json({ ok: true, username });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Misconfiguration (e.g. ADMIN_PASSWORD unset) lands here. Log the detail
    // server-side but never return it to the client.
    console.error("[login] unexpected error:", error);
    return NextResponse.json(
      { error: "Sign-in is temporarily unavailable." },
      { status: 500 },
    );
  }
}
