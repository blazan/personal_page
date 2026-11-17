"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import SmartImage from "./SmartImage";
import type { Project } from "@/lib/types";

/**
 * Case-study modal.
 *
 * Accessibility notes:
 * - Rendered into the DOM only while open, so no hidden content is tabbable.
 * - Focus moves to the dialog on open and returns to the trigger on close.
 * - Escape closes; body scroll is locked behind the overlay.
 */
export default function ProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!project) return;

    // Remember what had focus so it can be restored on close.
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    // Lock background scrolling while the modal is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog for screen-reader and keyboard users.
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [project, close]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:p-8"
      role="presentation"
      onClick={(event) => {
        // Close only when the backdrop itself is clicked, not the panel.
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        tabIndex={-1}
        className="animate-rise surface-card relative my-auto w-full max-w-3xl overflow-hidden rounded-3xl shadow-2xl"
      >
        {/* Cover image */}
        <div className="relative aspect-[16/9] w-full bg-[var(--surface-sunken)]">
          <SmartImage
            src={project.coverImage}
            alt={`Cover image for ${project.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 48rem"
            className="object-cover"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close case study"
            className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-slate-950/60 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-slate-950/80"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <span className="rounded-full bg-[var(--accent)]/10 px-2.5 py-1 font-medium text-[var(--accent)]">
              {project.category}
            </span>
            <span className="text-muted">{project.client}</span>
            {project.year && (
              <span className="text-muted">· {project.year}</span>
            )}
          </div>

          <h2
            id="project-modal-title"
            className="mt-4 text-2xl font-semibold sm:text-3xl"
          >
            {project.title}
          </h2>

          {/* Headline outcome */}
          <div className="mt-5 rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.06] px-5 py-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
              Key outcome
            </p>
            <p className="mt-1.5 text-lg font-semibold">{project.outcome}</p>
          </div>

          <Section title="The Challenge">
            <p className="text-[0.925rem] leading-relaxed text-secondary">
              {project.challenge}
            </p>
          </Section>

          <Section title="Strategy &amp; Execution">
            <p className="text-[0.925rem] leading-relaxed text-secondary">
              {project.strategy}
            </p>
          </Section>

          {project.tools.length > 0 && (
            <Section title="Tools Used">
              <ul className="flex flex-wrap gap-2">
                {project.tools.map((tool) => (
                  <li
                    key={tool}
                    className="rounded-lg border border-subtle bg-[var(--surface-sunken)] px-2.5 py-1 text-xs font-medium"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {project.results.length > 0 && (
            <Section title="Results">
              <ul className="space-y-2.5">
                {project.results.map((result) => (
                  <li key={result} className="flex items-start gap-3">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span className="text-[0.9rem] leading-relaxed text-secondary">
                      {result}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Deep link to the standalone page, useful for sharing a case study. */}
          <div className="mt-8 border-t border-subtle pt-6">
            <Link
              href={`/projects/${project.slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] transition-colors duration-200 hover:opacity-80"
            >
              Open as a standalone page
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small titled block used to keep the modal body consistent. */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <h3 className="mb-2.5 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}
