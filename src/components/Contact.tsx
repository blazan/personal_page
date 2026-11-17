"use client";

import { useState } from "react";
import type { ContactContent } from "@/lib/types";

/**
 * Contact section with a functional form.
 *
 * The form POSTs JSON to /api/contact, which validates and stores the message
 * in SQLite for the admin inbox. Validation runs on both sides: client-side for
 * fast feedback, server-side because the client can be bypassed.
 */
export default function Contact({ content }: { content: ContactContent }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Capture the form element before awaiting. React nulls out
    // event.currentTarget once the handler yields, so reading it after the
    // fetch would throw and report a failure for a message that was saved.
    const form = event.currentTarget;

    setStatus("sending");
    setErrorMessage("");

    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      company: String(formData.get("company") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStatus("sent");
      form.reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unexpected error.",
      );
    }
  }

  return (
    <section id="contact" className="scroll-mt-24 border-t border-subtle py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* Contact details column */}
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
              Contact
            </p>
            <h2 className="text-3xl font-semibold sm:text-4xl">
              {content.heading}
            </h2>
            <p className="mt-5 text-[0.975rem] leading-relaxed text-secondary">
              {content.intro}
            </p>

            <dl className="mt-9 space-y-5">
              <ContactRow
                label="Email"
                value={content.email}
                href={`mailto:${content.email}`}
                icon="mail"
              />
              <ContactRow
                label="Phone"
                value={content.phone}
                href={`tel:${content.phone.replace(/[^+\d]/g, "")}`}
                icon="phone"
              />
              <ContactRow label="Location" value={content.location} icon="pin" />
              <ContactRow
                label="LinkedIn"
                value="Connect on LinkedIn"
                href={content.linkedinUrl}
                icon="linkedin"
                external
              />
            </dl>

            {content.availability && (
              <p className="mt-9 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/[0.07] px-4 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {content.availability}
              </p>
            )}
          </div>

          {/* Form column */}
          <div className="surface-card rounded-3xl p-6 sm:p-8">
            {status === "sent" ? (
              // Success state replaces the form so there is no ambiguity.
              <div className="flex flex-col items-start gap-4 py-8">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-semibold">Message received</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-secondary">
                    Thank you — your message has been delivered. Expect a reply
                    within one business day.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-2 rounded-full border border-subtle px-4 py-2 text-xs font-semibold transition-colors duration-200 hover:bg-[var(--surface-sunken)]"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Jane Doe"
                  />
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="jane@company.com"
                  />
                </div>

                <Field
                  label="Company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  placeholder="Optional"
                />

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-xs font-semibold tracking-wide"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={6}
                    minLength={10}
                    maxLength={4000}
                    placeholder="Tell me about the programme, timeline and where you need help."
                    className="w-full resize-y rounded-xl border border-subtle bg-[var(--surface-sunken)] px-3.5 py-3 text-sm outline-none transition-colors duration-200 placeholder:text-muted focus:border-[var(--accent)]"
                  />
                </div>

                {status === "error" && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-500/30 bg-red-500/[0.07] px-3.5 py-2.5 text-xs text-red-700 dark:text-red-400"
                  >
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {status === "sending" ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Sending…
                    </>
                  ) : (
                    "Send message"
                  )}
                </button>

                <p className="text-xs leading-relaxed text-muted">
                  Your details are stored only to reply to this enquiry and are
                  never shared with third parties.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Labelled text input with consistent styling. */
function Field({
  label,
  name,
  type,
  required = false,
  autoComplete,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  const id = `contact-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold tracking-wide">
        {label}
        {!required && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={200}
        className="w-full rounded-xl border border-subtle bg-[var(--surface-sunken)] px-3.5 py-2.5 text-sm outline-none transition-colors duration-200 placeholder:text-muted focus:border-[var(--accent)]"
      />
    </div>
  );
}

/** One row in the contact-details list, with a small inline icon. */
function ContactRow({
  label,
  value,
  href,
  icon,
  external = false,
}: {
  label: string;
  value: string;
  href?: string;
  icon: "mail" | "phone" | "pin" | "linkedin";
  external?: boolean;
}) {
  const paths: Record<typeof icon, React.ReactNode> = {
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />
    ),
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    linkedin: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
  };

  const content = (
    <>
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-sunken)] text-[var(--accent)]">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {paths[icon]}
        </svg>
      </span>
      <span>
        <span className="block text-xs font-semibold tracking-wide text-muted uppercase">
          {label}
        </span>
        <span className="mt-0.5 block text-sm font-medium">{value}</span>
      </span>
    </>
  );

  return (
    <div className="flex items-start gap-3.5">
      {href ? (
        <a
          href={href}
          className="flex items-start gap-3.5 transition-opacity duration-200 hover:opacity-75"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {content}
        </a>
      ) : (
        <div className="flex items-start gap-3.5">{content}</div>
      )}
    </div>
  );
}
