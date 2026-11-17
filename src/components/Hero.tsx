import SmartImage from "./SmartImage";
import type { HeroContent } from "@/lib/types";

/**
 * Hero section.
 *
 * Server component: it only renders copy and an image, so no client bundle is
 * shipped for it. The asymmetric grid (wider copy column, narrower portrait)
 * reads as editorial rather than template-like on desktop, and collapses to a
 * single stacked column on mobile.
 */
export default function Hero({ content }: { content: HeroContent }) {
  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24">
      {/* Soft accent glow behind the portrait column. Purely decorative. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-[32rem] w-[32rem] rounded-full opacity-[0.10] blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, var(--accent) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          {/* Copy column */}
          <div className="animate-rise">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-subtle px-3.5 py-1.5 text-xs font-medium tracking-wide text-secondary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              </span>
              {content.eyebrow}
            </p>

            <h1 className="text-4xl leading-[1.08] font-semibold sm:text-5xl lg:text-[3.4rem]">
              {content.headline}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-secondary sm:text-lg">
              {content.subheadline}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={content.primaryCtaHref}
                className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110"
              >
                {content.primaryCtaLabel}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>

              <a
                href={content.secondaryCtaHref}
                className="inline-flex items-center gap-2 rounded-full border border-subtle px-6 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--surface-sunken)]"
              >
                {content.secondaryCtaLabel}
              </a>
            </div>
          </div>

          {/* Portrait column */}
          <div className="animate-rise [animation-delay:120ms]">
            <figure className="relative mx-auto w-full max-w-sm lg:max-w-none">
              {/* Offset frame gives the portrait depth without a drop shadow. */}
              <div
                aria-hidden="true"
                className="absolute -inset-3 -z-10 rounded-[1.75rem] border border-subtle"
              />
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[var(--surface-sunken)]">
                <SmartImage
                  src={content.portraitUrl}
                  alt="Portrait of Marijana Mandić, Senior Project Manager"
                  fill
                  priority
                  sizes="(max-width: 1024px) 24rem, 30rem"
                  className="object-cover"
                />
              </div>

              {content.portraitBadge && (
                <figcaption className="absolute -bottom-4 left-4 right-4 rounded-2xl border border-subtle bg-[var(--surface-raised)]/95 px-4 py-3 backdrop-blur-sm sm:left-6 sm:right-auto">
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    {content.portraitBadge}
                  </span>
                </figcaption>
              )}
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
