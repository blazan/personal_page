// This module is server-only. It reads Node built-ins and native addons that
// cannot be bundled for the browser. It is imported exclusively from server
// components and route handlers, never from a "use client" module.

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Admin authentication.
 *
 * Credentials come from the environment (ADMIN_USERNAME / ADMIN_PASSWORD), so
 * no password is ever stored in the repository. A successful login mints a
 * short-lived, HTTP-only, SameSite=Lax JWT cookie; every admin API route and
 * the admin layout re-verify that token.
 */

const COOKIE_NAME = "mm_admin_session";

/** Session lifetime: long enough for a working day, short enough to expire. */
const SESSION_TTL_SECONDS = 60 * 60 * 8;

/**
 * Signing key for the session JWT.
 *
 * Derived from AUTH_SECRET when provided. In production a missing secret is a
 * hard error — a predictable key would let anyone forge an admin session. In
 * development we fall back to a fixed dev key so `npm run dev` works out of the
 * box without extra setup.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET must be set to at least 32 characters in production. " +
        "Generate one with: openssl rand -base64 48",
    );
  }

  return new TextEncoder().encode("development-only-insecure-secret-key-32+");
}

/** Configured admin username, defaulting to `admin` for local development. */
function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME || "admin";
}

/** Configured admin password. Empty by default so dev requires explicit setup. */
function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

/**
 * Compares two strings in constant time to avoid leaking length/prefix
 * information through response timing.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");

  // Hash both sides first so differing lengths do not short-circuit the
  // comparison and leak the expected length.
  const digestA = crypto.createHash("sha256").update(bufferA).digest();
  const digestB = crypto.createHash("sha256").update(bufferB).digest();

  return crypto.timingSafeEqual(digestA, digestB);
}

/** Returns true when the supplied credentials match the environment config. */
export function verifyCredentials(username: string, password: string): boolean {
  const expectedPassword = getAdminPassword();

  if (!expectedPassword) {
    throw new Error(
      "ADMIN_PASSWORD is not set. Configure ADMIN_USERNAME and ADMIN_PASSWORD " +
        "in your .env file (see .env.example).",
    );
  }

  // Evaluate both comparisons so the response time does not reveal which
  // field was wrong.
  const userOk = timingSafeEqual(username, getAdminUsername());
  const passOk = timingSafeEqual(password, expectedPassword);
  return userOk && passOk;
}

/** Mints a signed session token for the admin user. */
export async function createSessionToken(username: string): Promise<string> {
  return new SignJWT({ sub: username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("marijana-portfolio")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

/** Verifies a session token, returning its payload or null when invalid. */
export async function verifySessionToken(
  token: string,
): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: "marijana-portfolio",
    });
    return { sub: String(payload.sub) };
  } catch {
    return null;
  }
}

/** Sets the session cookie after a successful login. */
export async function startSession(username: string): Promise<void> {
  const token = await createSessionToken(username);
  const store = await cookies();

  store.set(COOKIE_NAME, token, {
    httpOnly: true, // not readable from JavaScript, mitigates XSS token theft
    sameSite: "lax", // blocks cross-site POSTs, keeps normal navigation working
    secure: process.env.NODE_ENV === "production", // HTTPS-only in production
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Clears the session cookie. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Reads and validates the current session, or null when not signed in. */
export async function getSession(): Promise<{ sub: string } | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Guard for route handlers. Returns the session when authenticated and null
 * otherwise, so callers can respond with 401 without throwing.
 */
export async function requireSession(): Promise<{ sub: string } | null> {
  return getSession();
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
