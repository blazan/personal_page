import {
  asObject,
  optionalString,
  requireString,
  toStringArray,
  toBoolean,
  validateImageUrl,
} from "./validation";

/**
 * Validation for project create/update payloads.
 *
 * Kept in its own module because both the collection route (POST) and the item
 * route (PUT) need the identical shape, and a divergence between them would
 * silently allow a field to be set on create but not on edit.
 */

export interface ParsedProjectInput {
  title: string;
  category: string;
  client: string;
  summary: string;
  outcome: string;
  challenge: string;
  strategy: string;
  tools: string[];
  results: string[];
  coverImage: string;
  year: string;
  featured: boolean;
}

/** A neutral placeholder used when a project is saved without a cover image. */
const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80";

export function parseProjectInput(body: unknown): ParsedProjectInput {
  const input = asObject(body, "Project");

  return {
    title: requireString(input.title, "Title", { max: 160 }),
    category: requireString(input.category, "Category", { max: 80 }),
    client: requireString(input.client, "Client / industry", { max: 160 }),
    summary: requireString(input.summary, "Summary", { min: 10, max: 600 }),
    outcome: requireString(input.outcome, "Key outcome metric", { max: 200 }),
    challenge: requireString(input.challenge, "Challenge", { min: 10, max: 4000 }),
    strategy: requireString(input.strategy, "Strategy & execution", {
      min: 10,
      max: 6000,
    }),
    tools: toStringArray(input.tools, "Tools"),
    results: toStringArray(input.results, "Results"),
    // Allow an empty cover so a project can be drafted before artwork exists.
    coverImage:
      optionalString(input.coverImage, "Cover image", { max: 1000 }) === null
        ? FALLBACK_COVER
        : validateImageUrl(input.coverImage, "Cover image"),
    year: optionalString(input.year, "Year", { max: 40 }) ?? "",
    featured: toBoolean(input.featured),
  };
}
