/**
 * Shared domain types for the portfolio site.
 *
 * Content is stored in SQLite as JSON blobs inside a key/value `settings`
 * table. That keeps the schema tiny while letting the admin panel add or
 * reorder sections without a migration. These types are the single source of
 * truth for both the API layer and the React components.
 */

/** A single editable KPI shown in the impact bar. */
export interface Metric {
  /** Short numeric/percentage value, e.g. "98%". */
  value: string;
  /** What the value measures, e.g. "On-Time Delivery". */
  label: string;
  /** Optional supporting sentence shown under the label. */
  detail?: string;
}

/** Hero section copy plus the portrait image. */
export interface HeroContent {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  /** URL or local /api/media path. */
  portraitUrl: string;
  /** Small badge text rendered over the portrait, e.g. availability. */
  portraitBadge: string;
}

/** About section: bio paragraphs plus certification chips. */
export interface AboutContent {
  heading: string;
  /** Each string is rendered as its own paragraph. */
  paragraphs: string[];
  /** Certification / methodology chips, e.g. "PMP", "CSM", "PRINCE2". */
  certifications: string[];
  /** Short leadership-philosophy callouts rendered as a list. */
  principles: { title: string; description: string }[];
}

/** Contact details and the section heading. */
export interface ContactContent {
  heading: string;
  intro: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  /** Free-text availability line, e.g. "Open to Q3 2026 engagements". */
  availability: string;
}

/** Every editable piece of site copy, grouped by section. */
export interface SiteContent {
  hero: HeroContent;
  about: AboutContent;
  metrics: Metric[];
  contact: ContactContent;
}

/** A portfolio case study. */
export interface Project {
  id: number;
  slug: string;
  title: string;
  /** Category / tag shown on the card, e.g. "Digital Transformation". */
  category: string;
  /** Client or industry descriptor. */
  client: string;
  /** One-line summary for the card. */
  summary: string;
  /** Headline outcome metric, e.g. "Reduced operational costs by 24%". */
  outcome: string;
  /** Full case-study body. */
  challenge: string;
  strategy: string;
  /** Tools and platforms used (Jira, Asana, Confluence, ...). */
  tools: string[];
  /** Bullet list of quantified results. */
  results: string[];
  coverImage: string;
  /** Delivery period, free text, e.g. "2023 — 2024". */
  year: string;
  featured: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/** A message submitted through the public contact form. */
export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  company: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/** Payload accepted when creating or updating a project. */
export type ProjectInput = Omit<
  Project,
  "id" | "createdAt" | "updatedAt" | "position"
> & { position?: number };
