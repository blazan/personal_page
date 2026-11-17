import { NextResponse } from "next/server";

import { requireSession } from "./auth";
import { ValidationError } from "./validation";

/**
 * Shared plumbing for the /api/admin routes.
 *
 * Every admin handler starts with `guard()`; if it returns a response, the
 * caller returns it immediately. This keeps the authentication check in one
 * place so a new route cannot accidentally ship unprotected.
 */

/** Returns a 401 response when the caller is not signed in, otherwise null. */
export async function guard(): Promise<NextResponse | null> {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }
  return null;
}

/**
 * Wraps a handler body so validation and unexpected errors become clean JSON
 * responses. Unexpected errors are logged server-side but never echoed to the
 * client, which would leak internal detail.
 */
export async function handle(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[admin] request failed:", error);
    return NextResponse.json(
      { error: "The request could not be completed." },
      { status: 500 },
    );
  }
}

/** Parses a route parameter that must be a positive integer. */
export function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("Invalid identifier.");
  }
  return id;
}
