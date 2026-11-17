"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import ImageUploader from "./ImageUploader";
import {
  Button,
  ListField,
  StatusBanner,
  TextAreaField,
  TextField,
} from "./FormFields";
import type { SiteContent } from "@/lib/types";

type Tab = "hero" | "metrics" | "about" | "contact";

const TABS: { id: Tab; label: string }[] = [
  { id: "hero", label: "Hero" },
  { id: "metrics", label: "Key metrics" },
  { id: "about", label: "About & methodology" },
  { id: "contact", label: "Contact details" },
];

/**
 * Content editor for all site copy.
 *
 * State is a full local copy of the content; only the active tab is sent to the
 * server on save, which keeps each request small and means an unsaved change in
 * one tab cannot be clobbered by saving another.
 */
export default function ContentEditor({ initial }: { initial: SiteContent }) {
  const [content, setContent] = useState<SiteContent>(initial);
  const [tab, setTab] = useState<Tab>("hero");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  /** Applies a partial update to one section of the local content state. */
  function updateSection<K extends keyof SiteContent>(
    section: K,
    patch: Partial<SiteContent[K]>,
  ) {
    setContent((previous) => ({
      ...previous,
      [section]: { ...previous[section], ...patch },
    }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);

    try {
      // Send only the section being edited.
      const payload = { [tab]: content[tab] };
      const result = await api.put<{ content: SiteContent }>(
        "/api/admin/content",
        payload,
      );

      // Adopt the server's canonical version so any normalisation it applied
      // (trimming, defaults) is reflected in the form.
      setContent(result.content);
      setMessage({ tone: "success", text: "Changes saved and live on the site." });
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof ApiError
            ? error.message
            : "Changes could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab strip */}
      <div className="flex flex-wrap gap-1.5 border-b border-subtle pb-px">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setMessage(null);
            }}
            className={`-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors duration-200 ${
              tab === item.id
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-secondary hover:text-[var(--text-primary)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="surface-card space-y-6 rounded-2xl p-6">
        {tab === "hero" && (
          <HeroTab
            hero={content.hero}
            onChange={(patch) => updateSection("hero", patch)}
          />
        )}

        {tab === "metrics" && (
          <MetricsTab
            metrics={content.metrics}
            onChange={(metrics) => updateSection("metrics", metrics)}
          />
        )}

        {tab === "about" && (
          <AboutTab
            about={content.about}
            onChange={(patch) => updateSection("about", patch)}
          />
        )}

        {tab === "contact" && (
          <ContactTab
            contact={content.contact}
            onChange={(patch) => updateSection("contact", patch)}
          />
        )}

        {message && <StatusBanner tone={message.tone}>{message.text}</StatusBanner>}

        <div className="flex items-center gap-3 border-t border-subtle pt-5">
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
          <p className="text-xs text-muted">
            Saved sections appear on the public site immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tab bodies                                                                 */
/* -------------------------------------------------------------------------- */

function HeroTab({
  hero,
  onChange,
}: {
  hero: SiteContent["hero"];
  onChange: (patch: Partial<SiteContent["hero"]>) => void;
}) {
  return (
    <div className="space-y-5">
      <TextField
        label="Eyebrow"
        value={hero.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
        hint="Small label above the headline."
      />
      <TextAreaField
        label="Headline"
        rows={2}
        value={hero.headline}
        onChange={(headline) => onChange({ headline })}
      />
      <TextAreaField
        label="Subheadline"
        rows={4}
        value={hero.subheadline}
        onChange={(subheadline) => onChange({ subheadline })}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Primary button label"
          value={hero.primaryCtaLabel}
          onChange={(primaryCtaLabel) => onChange({ primaryCtaLabel })}
        />
        <TextField
          label="Primary button link"
          value={hero.primaryCtaHref}
          onChange={(primaryCtaHref) => onChange({ primaryCtaHref })}
          hint="An in-page anchor such as #projects, or a full URL."
        />
        <TextField
          label="Secondary button label"
          value={hero.secondaryCtaLabel}
          onChange={(secondaryCtaLabel) => onChange({ secondaryCtaLabel })}
        />
        <TextField
          label="Secondary button link"
          value={hero.secondaryCtaHref}
          onChange={(secondaryCtaHref) => onChange({ secondaryCtaHref })}
        />
      </div>

      <TextField
        label="Portrait badge"
        value={hero.portraitBadge}
        onChange={(portraitBadge) => onChange({ portraitBadge })}
        hint="Small status line over the portrait. Leave blank to hide."
      />

      <ImageUploader
        label="Profile portrait"
        prefix="portrait"
        aspect="aspect-[4/5]"
        value={hero.portraitUrl}
        onChange={(portraitUrl) => onChange({ portraitUrl })}
      />
    </div>
  );
}

function MetricsTab({
  metrics,
  onChange,
}: {
  metrics: SiteContent["metrics"];
  onChange: (metrics: SiteContent["metrics"]) => void;
}) {
  /** Replaces one metric immutably. */
  function update(index: number, patch: Partial<SiteContent["metrics"][number]>) {
    onChange(
      metrics.map((metric, position) =>
        position === index ? { ...metric, ...patch } : metric,
      ),
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-secondary">
        These four figures appear in the impact bar directly under the hero.
      </p>

      {metrics.map((metric, index) => (
        <div
          key={index}
          className="rounded-2xl border border-subtle bg-[var(--surface-sunken)]/50 p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-muted">
              METRIC {index + 1}
            </span>
            {metrics.length > 1 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onChange(metrics.filter((_, position) => position !== index))}
              >
                Remove
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <TextField
              label="Value"
              value={metric.value}
              onChange={(value) => update(index, { value })}
              placeholder="98%"
            />
            <TextField
              label="Label"
              value={metric.label}
              onChange={(label) => update(index, { label })}
              placeholder="On-Time Delivery"
            />
          </div>

          <div className="mt-4">
            <TextField
              label="Supporting detail"
              value={metric.detail ?? ""}
              onChange={(detail) => update(index, { detail })}
              placeholder="Across 35+ enterprise engagements since 2015"
            />
          </div>
        </div>
      ))}

      {metrics.length < 8 && (
        <Button
          variant="secondary"
          onClick={() =>
            onChange([...metrics, { value: "", label: "", detail: "" }])
          }
        >
          + Add metric
        </Button>
      )}
    </div>
  );
}

function AboutTab({
  about,
  onChange,
}: {
  about: SiteContent["about"];
  onChange: (patch: Partial<SiteContent["about"]>) => void;
}) {
  return (
    <div className="space-y-5">
      <TextField
        label="Heading"
        value={about.heading}
        onChange={(heading) => onChange({ heading })}
      />

      <ListField
        label="Bio paragraphs"
        rows={8}
        value={about.paragraphs}
        onChange={(paragraphs) => onChange({ paragraphs })}
        hint="One paragraph per line. Blank lines are ignored."
      />

      <ListField
        label="Certifications"
        rows={5}
        value={about.certifications}
        onChange={(certifications) => onChange({ certifications })}
        hint="One certification per line, e.g. PMP."
      />

      {/* Leadership principles: a fixed set of title/description pairs. */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide">
            Leadership principles
          </span>
          {about.principles.length < 8 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onChange({
                  principles: [
                    ...about.principles,
                    { title: "", description: "" },
                  ],
                })
              }
            >
              + Add principle
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {about.principles.map((principle, index) => (
            <div
              key={index}
              className="rounded-2xl border border-subtle bg-[var(--surface-sunken)]/50 p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-muted">
                  PRINCIPLE {index + 1}
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    onChange({
                      principles: about.principles.filter(
                        (_, position) => position !== index,
                      ),
                    })
                  }
                >
                  Remove
                </Button>
              </div>

              <TextField
                label="Title"
                value={principle.title}
                onChange={(title) =>
                  onChange({
                    principles: about.principles.map((item, position) =>
                      position === index ? { ...item, title } : item,
                    ),
                  })
                }
              />

              <div className="mt-4">
                <TextAreaField
                  label="Description"
                  rows={3}
                  value={principle.description}
                  onChange={(description) =>
                    onChange({
                      principles: about.principles.map((item, position) =>
                        position === index ? { ...item, description } : item,
                      ),
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactTab({
  contact,
  onChange,
}: {
  contact: SiteContent["contact"];
  onChange: (patch: Partial<SiteContent["contact"]>) => void;
}) {
  return (
    <div className="space-y-5">
      <TextField
        label="Heading"
        value={contact.heading}
        onChange={(heading) => onChange({ heading })}
      />
      <TextAreaField
        label="Intro"
        rows={4}
        value={contact.intro}
        onChange={(intro) => onChange({ intro })}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Email"
          type="email"
          value={contact.email}
          onChange={(email) => onChange({ email })}
        />
        <TextField
          label="Phone"
          value={contact.phone}
          onChange={(phone) => onChange({ phone })}
        />
        <TextField
          label="Location"
          value={contact.location}
          onChange={(location) => onChange({ location })}
        />
        <TextField
          label="LinkedIn URL"
          type="url"
          value={contact.linkedinUrl}
          onChange={(linkedinUrl) => onChange({ linkedinUrl })}
        />
      </div>

      <TextField
        label="Availability line"
        value={contact.availability}
        onChange={(availability) => onChange({ availability })}
        hint="Leave blank to hide the availability badge."
      />
    </div>
  );
}
