import { NextResponse } from "next/server";

import { getContent, saveContent } from "@/lib/db";
import { guard, handle } from "@/lib/api-helpers";
import {
  asObject,
  optionalString,
  readJsonBody,
  requireEmail,
  requireString,
  toStringArray,
  validateHref,
  validateImageUrl,
  ValidationError,
} from "@/lib/validation";
import type { AboutContent, ContactContent, HeroContent, Metric, SiteContent } from "@/lib/types";

/**
 * GET  /api/admin/content — full site copy for the admin editor.
 * PUT  /api/admin/content — replaces one or more sections.
 *
 * Only the sections present in the request body are written, so the admin UI
 * can save a single tab without resending everything. Sections are validated
 * field by field: the database should never contain a half-formed section.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  return NextResponse.json({ content: getContent() });
}

export async function PUT(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  return handle(async () => {
    const body = asObject(await readJsonBody(request));
    const patch: Partial<SiteContent> = {};

    if (body.hero !== undefined) {
      patch.hero = parseHero(asObject(body.hero, "Hero"));
    }
    if (body.about !== undefined) {
      patch.about = parseAbout(asObject(body.about, "About"));
    }
    if (body.metrics !== undefined) {
      patch.metrics = parseMetrics(body.metrics);
    }
    if (body.contact !== undefined) {
      patch.contact = parseContact(asObject(body.contact, "Contact"));
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No editable sections were provided." },
        { status: 400 },
      );
    }

    const content = saveContent(patch);
    return NextResponse.json({ ok: true, content });
  });
}

function parseHero(input: Record<string, unknown>): HeroContent {
  return {
    eyebrow: requireString(input.eyebrow, "Eyebrow", { max: 160 }),
    headline: requireString(input.headline, "Headline", { max: 240 }),
    subheadline: requireString(input.subheadline, "Subheadline", { max: 1200 }),
    primaryCtaLabel: requireString(input.primaryCtaLabel, "Primary button label", {
      max: 60,
    }),
    primaryCtaHref: validateHref(input.primaryCtaHref, "Primary button link"),
    secondaryCtaLabel: requireString(
      input.secondaryCtaLabel,
      "Secondary button label",
      { max: 60 },
    ),
    secondaryCtaHref: validateHref(
      input.secondaryCtaHref,
      "Secondary button link",
    ),
    portraitUrl: validateImageUrl(input.portraitUrl, "Portrait"),
    portraitBadge: optionalString(input.portraitBadge, "Portrait badge", {
      max: 120,
    }) ?? "",
  };
}

function parseAbout(input: Record<string, unknown>): AboutContent {
  const paragraphs = toStringArray(input.paragraphs, "Bio paragraphs");
  if (paragraphs.length === 0) {
    throw new ValidationError("At least one bio paragraph is required.");
  }

  // Principles arrive as an array of {title, description} objects from the UI.
  const rawPrinciples = Array.isArray(input.principles) ? input.principles : [];
  const principles = rawPrinciples.map((entry, index) => {
    const record = asObject(entry, `Principle ${index + 1}`);
    return {
      title: requireString(record.title, `Principle ${index + 1} title`, {
        max: 120,
      }),
      description: requireString(
        record.description,
        `Principle ${index + 1} description`,
        { max: 600 },
      ),
    };
  });

  return {
    heading: requireString(input.heading, "About heading", { max: 200 }),
    paragraphs,
    certifications: toStringArray(input.certifications, "Certifications"),
    principles,
  };
}

function parseMetrics(input: unknown): Metric[] {
  if (!Array.isArray(input)) {
    throw new ValidationError("Metrics must be a list.");
  }
  if (input.length > 8) {
    throw new ValidationError("A maximum of 8 metrics is supported.");
  }

  return input.map((entry, index) => {
    const record = asObject(entry, `Metric ${index + 1}`);
    return {
      value: requireString(record.value, `Metric ${index + 1} value`, { max: 20 }),
      label: requireString(record.label, `Metric ${index + 1} label`, { max: 80 }),
      detail:
        optionalString(record.detail, `Metric ${index + 1} detail`, { max: 200 }) ??
        undefined,
    };
  });
}

function parseContact(input: Record<string, unknown>): ContactContent {
  return {
    heading: requireString(input.heading, "Contact heading", { max: 200 }),
    intro: requireString(input.intro, "Contact intro", { max: 1200 }),
    email: requireEmail(input.email, "Contact email"),
    phone: requireString(input.phone, "Contact phone", { max: 60 }),
    location: requireString(input.location, "Contact location", { max: 200 }),
    linkedinUrl: validateHref(input.linkedinUrl, "LinkedIn URL"),
    availability: optionalString(input.availability, "Availability", {
      max: 200,
    }) ?? "",
  };
}
