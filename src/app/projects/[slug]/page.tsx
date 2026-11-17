import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SmartImage from "@/components/SmartImage";
import { getProjectBySlug, listProjects } from "@/lib/db";

/**
 * Standalone case-study page.
 *
 * The homepage modal is the primary reading experience, but a real URL per
 * project matters: it can be shared, bookmarked, indexed by search engines and
 * linked from a proposal.
 */

// Rendered per request so admin edits are reflected immediately.
export const dynamic = "force-dynamic";

interface PageProps {
  // Next.js 15 passes route params as a promise.
  params: Promise<{ slug: string }>;
}

/** Builds per-project metadata for search engines and link previews. */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return { title: "Case study not found" };
  }

  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: `${project.title} — ${project.outcome}`,
      description: project.summary,
      images: project.coverImage ? [{ url: project.coverImage }] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) notFound();

  // Offer up to two other case studies as onward navigation.
  const others = listProjects()
    .filter((item) => item.id !== project.id)
    .slice(0, 2);

  return (
    <>
      <SiteHeader />
      <main className="pt-28 pb-20 sm:pt-32">
        <article className="mx-auto max-w-3xl px-5 sm:px-8">
          {/* Breadcrumb */}
          <Link
            href="/#projects"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors duration-200 hover:text-[var(--accent)]"
          >
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
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            All projects
          </Link>

          <header className="mt-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
              <span className="rounded-full bg-[var(--accent)]/10 px-2.5 py-1 font-medium text-[var(--accent)]">
                {project.category}
              </span>
              <span className="text-muted">{project.client}</span>
              {project.year && <span className="text-muted">· {project.year}</span>}
            </div>

            <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">
              {project.title}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-secondary">
              {project.summary}
            </p>
          </header>

          {/* Cover image */}
          <div className="relative mt-9 aspect-[16/9] w-full overflow-hidden rounded-3xl bg-[var(--surface-sunken)]">
            <SmartImage
              src={project.coverImage}
              alt={`Cover image for ${project.title}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 48rem"
              className="object-cover"
            />
          </div>

          {/* Headline outcome */}
          <div className="mt-8 rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.06] px-6 py-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
              Key outcome
            </p>
            <p className="mt-2 text-xl font-semibold">{project.outcome}</p>
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">The Challenge</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-secondary">
              {project.challenge}
            </p>
          </section>

          <section className="mt-9">
            <h2 className="text-lg font-semibold">Strategy &amp; Execution</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-secondary">
              {project.strategy}
            </p>
          </section>

          {project.tools.length > 0 && (
            <section className="mt-9">
              <h2 className="text-lg font-semibold">Tools Used</h2>
              <ul className="mt-3.5 flex flex-wrap gap-2">
                {project.tools.map((tool) => (
                  <li
                    key={tool}
                    className="rounded-lg border border-subtle bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-medium"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {project.results.length > 0 && (
            <section className="mt-9">
              <h2 className="text-lg font-semibold">Results</h2>
              <ul className="mt-4 space-y-3">
                {project.results.map((result) => (
                  <li key={result} className="flex items-start gap-3">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="mt-1 h-4 w-4 shrink-0 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span className="text-[0.925rem] leading-relaxed text-secondary">
                      {result}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Call to action */}
          <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-subtle pt-8">
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
            >
              Discuss a similar programme
            </Link>
            <Link
              href="/#projects"
              className="inline-flex items-center gap-2 rounded-full border border-subtle px-6 py-3 text-sm font-semibold transition-colors duration-200 hover:bg-[var(--surface-sunken)]"
            >
              Back to all projects
            </Link>
          </div>

          {/* Onward navigation */}
          {others.length > 0 && (
            <nav
              className="mt-14 border-t border-subtle pt-8"
              aria-label="More case studies"
            >
              <h2 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                More case studies
              </h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {others.map((other) => (
                  <li key={other.id}>
                    <Link
                      href={`/projects/${other.slug}`}
                      className="surface-card group block rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                    >
                      <span className="block text-xs text-muted">
                        {other.category}
                      </span>
                      <span className="mt-1.5 block text-sm font-semibold">
                        {other.title}
                      </span>
                      <span className="mt-2 block text-xs leading-relaxed text-secondary">
                        {other.outcome}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
