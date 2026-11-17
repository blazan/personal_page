import { NextResponse } from "next/server";

import { createMessage } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  asObject,
  optionalString,
  readJsonBody,
  requireEmail,
  requireString,
  ValidationError,
} from "@/lib/validation";

/**
 * POST /api/contact
 *
 * Public endpoint backing the contact form. Validates the submission and writes
 * it to SQLite, where it appears in the admin inbox.
 *
 * Abuse controls: three submissions per IP per 10 minutes, plus a hidden
 * honeypot field the browser never fills. Both are cheap and stop the vast
 * majority of form spam without a CAPTCHA.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`contact:${ip}`, 3, 10 * 60 * 1000);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `You have sent several messages already. Please try again in ${Math.ceil(limit.retryAfter / 60)} minute(s), or email directly.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const body = asObject(await readJsonBody(request));

    // Honeypot: a real browser leaves this empty. Bots fill every field.
    // Respond 200 so the bot believes it succeeded and does not retry.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    const name = requireString(body.name, "Name", { min: 2, max: 120 });
    const email = requireEmail(body.email);
    const company = optionalString(body.company, "Company", { max: 160 });
    const message = requireString(body.message, "Message", {
      min: 10,
      max: 4000,
    });

    const saved = createMessage({ name, email, company, message });

    return NextResponse.json({ ok: true, id: saved.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[contact] failed to store message:", error);
    return NextResponse.json(
      { error: "Your message could not be sent. Please try again shortly." },
      { status: 500 },
    );
  }
}
