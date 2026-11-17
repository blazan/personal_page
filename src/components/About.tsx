import type { AboutContent } from "@/lib/types";

/**
 * About & methodology section.
 *
 * Two columns on desktop: narrative bio on the left, and the leadership
 * principles plus certification chips on the right, so the reading column stays
 * at a comfortable measure.
 */
export default function About({ content }: { content: AboutContent }) {
  return (
    <section id="about" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          {/* Bio column */}
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
              About &amp; Methodology
            </p>
            <h2 className="text-3xl font-semibold sm:text-4xl">
              {content.heading}
            </h2>

            <div className="mt-7 space-y-5">
              {content.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-[0.975rem] leading-relaxed text-secondary"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Certification chips */}
            {content.certifications.length > 0 && (
              <div className="mt-9">
                <h3 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                  Certifications
                </h3>
                <ul className="mt-3.5 flex flex-wrap gap-2">
                  {content.certifications.map((certification) => (
                    <li
                      key={certification}
                      className="rounded-full border border-subtle bg-[var(--surface-raised)] px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      {certification}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Principles column */}
          <div className="lg:pt-16">
            <ul className="space-y-3">
              {content.principles.map((principle, index) => (
                <li
                  key={principle.title}
                  className="surface-card group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--accent)]/10 text-[0.7rem] font-bold text-[var(--accent)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">
                        {principle.title}
                      </h3>
                      <p className="mt-1.5 text-[0.85rem] leading-relaxed text-secondary">
                        {principle.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
