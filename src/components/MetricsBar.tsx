import type { Metric } from "@/lib/types";

/**
 * Impact bar: four editable KPIs.
 *
 * A server component with no client-side animation library — the counters are
 * static text, which keeps Largest Contentful Paint fast and avoids layout
 * shift from a counting animation.
 */
export default function MetricsBar({ metrics }: { metrics: Metric[] }) {
  if (metrics.length === 0) return null;

  return (
    <section
      aria-label="Key results"
      className="border-y border-subtle bg-[var(--surface-raised)]"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* 2 columns on mobile, 4 from the md breakpoint up. */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:py-12 md:grid-cols-4">
          {metrics.map((metric, index) => (
            <div
              key={`${metric.label}-${index}`}
              className="group relative md:px-2"
            >
              {/* Vertical hairline separators between columns on wide screens. */}
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-1 -left-3 hidden h-12 w-px bg-[var(--border-subtle)] md:block"
                />
              )}
              <dt className="text-3xl font-semibold tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 bg-clip-text text-transparent">
                  {metric.value}
                </span>
              </dt>
              <dd className="mt-2">
                <span className="block text-sm font-medium">
                  {metric.label}
                </span>
                {metric.detail && (
                  <span className="mt-1 block text-xs leading-relaxed text-muted">
                    {metric.detail}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
