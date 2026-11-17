/**
 * Input validation helpers.
 *
 * Hand-written rather than schema-library based: the payloads here are small
 * and fixed, and every function returns a plain error string so route handlers
 * can respond with 400 and a message the user can act on. All input that
 * reaches SQLite goes through here, and all queries are parameterised.
 */

export class ValidationError extends Error {}

/** Trims a value and enforces a length range. */
export function requireString(
  value: unknown,
  field: string,
  { min = 1, max = 200 }: { min?: number; max?: number } = {},
): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be text.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new ValidationError(`${field} is required.`);
  }
  if (trimmed.length > max) {
    throw new ValidationError(`${field} must be ${max} characters or fewer.`);
  }
  return trimmed;
}

/** Optional text field: returns null when absent or blank. */
export function optionalString(
  value: unknown,
  field: string,
  { max = 500 }: { max?: number } = {},
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be text.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > max) {
    throw new ValidationError(`${field} must be ${max} characters or fewer.`);
  }
  return trimmed;
}

/**
 * Validates an email address.
 *
 * Deliberately permissive: the goal is to reject obvious mistakes, not to
 * implement RFC 5322. A too-strict pattern rejects valid addresses.
 */
export function requireEmail(value: unknown, field = "Email"): string {
  const email = requireString(value, field, { max: 254 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new ValidationError(`${field} does not look like a valid address.`);
  }
  return email;
}

/** Accepts a JSON array of strings, or a newline-separated string. */
export function toStringArray(value: unknown, field: string): string[] {
  let items: unknown[];

  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === "string") {
    // Admin forms submit these as one item per line.
    items = value.split("\n");
  } else if (value === undefined || value === null) {
    return [];
  } else {
    throw new ValidationError(`${field} must be a list.`);
  }

  const cleaned = items
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0)
    .map((item) => item.slice(0, 300));

  if (cleaned.length > 40) {
    throw new ValidationError(`${field} cannot contain more than 40 entries.`);
  }
  return cleaned;
}

/** Parses a JSON request body, converting malformed input into a 400. */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}

/** Narrows an unknown value to a plain object. */
export function asObject(value: unknown, field = "Body"): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError(`${field} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

/** Coerces a value to a boolean, accepting form-style "true"/"on"/"1". */
export function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "on", "1", "yes"].includes(value.toLowerCase());
  }
  return Boolean(value);
}

/**
 * Validates an image URL supplied by an admin.
 *
 * Only two forms are accepted: a path we generated under /api/media, or an
 * https URL. This stops an admin field from being used to inject a
 * `javascript:` or `data:` URI into an <img src>.
 */
export function validateImageUrl(value: unknown, field = "Image URL"): string {
  const url = requireString(value, field, { max: 1000 });

  if (url.startsWith("/api/media/")) return url;

  if (/^https:\/\//i.test(url)) return url;

  throw new ValidationError(
    `${field} must be an uploaded image or an https:// URL.`,
  );
}

/**
 * Validates a link that will be rendered into an `href`.
 *
 * This is the counterpart to validateImageUrl and it exists for the same
 * reason: a value like `javascript:alert(document.cookie)` placed in an href
 * executes in the visitor's browser when clicked, and it would be stored in
 * the database and served to every visitor. React does not sanitise hrefs.
 *
 * Accepted forms:
 *   - an internal path: "/", "/projects", "/#contact"
 *   - a bare fragment: "#projects" (the seeded CTAs use these)
 *   - an absolute web URL: http:// or https://
 *   - mailto: and tel: links, which the contact section uses
 *
 * Rejected: javascript:, data:, vbscript:, file:, blob:, and protocol-relative
 * "//host" URLs (which silently become a cross-origin request).
 */
export function validateHref(value: unknown, field = "Link"): string {
  const url = requireString(value, field, { max: 500 });

  // Bare fragment, e.g. "#contact". Safe: it only scrolls within the page.
  if (url.startsWith("#")) return url;

  // Internal absolute path. "//" is rejected: it is protocol-relative and
  // would resolve to another host.
  if (url.startsWith("/") && !url.startsWith("//")) return url;

  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;

  throw new ValidationError(
    `${field} must start with #, /, https://, http://, mailto: or tel:.`,
  );
}
