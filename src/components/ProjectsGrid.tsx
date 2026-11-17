"use client";

import { useState } from "react";
import Link from "next/link";
import SmartImage from "./SmartImage";
import ProjectModal from "./ProjectModal";
import type { Project } from "@/lib/types";

/**
 * Featured projects grid.
 *
 * This is a client component because it owns the modal's open/selected state.
 * The project data itself is fetched on the server and passed down, so no
 * database access happens in the browser.
 */
export default function ProjectsGrid({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <section id="projects" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            Selected Work
          </p>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Featured case studies
          </h2>
          <p className="mt-4 text-[0.975rem] leading-relaxed text-secondary">
            Four programmes that show the range: a multi-country ERP
            consolidation, a stalled fintech launch brought back on track, a
            supply-chain replatform, and an AI support automation with a
            measurable deflection rate. Each card opens the full case study.
          </p>
        </div>

        {projects.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-subtle p-8 text-center text-sm text-muted">
            No projects are published yet. Add one from the admin panel at{" "}
            <code className="rounded bg-[var(--surface-sunken)] px-1.5 py-0.5">
              /admin
            </code>
            .
          </p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:gap-7">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onOpen={() => setSelected(project)}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

/** A single project card. The whole card is a button that opens the modal. */
function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: () => void;
}) {
  return (
    <article className="group surface-card relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-xl">
      {/* Cover image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--surface-sunken)]">
        <SmartImage
          src={project.coverImage}
          alt={`Cover image for ${project.title}`}
          fill
          // Only the first two cards are above the fold on most viewports.
          priority={index < 2}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 34rem"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        <span className="absolute top-4 left-4 rounded-full bg-[var(--surface-raised)]/92 px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--text-primary)] backdrop-blur-sm">
          {project.category}
        </span>
      </div>

      {/* Copy */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{project.client}</span>
          {project.year && (
            <>
              <span aria-hidden="true">·</span>
              <span>{project.year}</span>
            </>
          )}
        </div>

        <h3 className="mt-2 text-lg font-semibold">{project.title}</h3>

        <p className="mt-2.5 flex-1 text-[0.875rem] leading-relaxed text-secondary">
          {project.summary}
        </p>

        {/* Key outcome metric */}
        <div className="mt-5 flex items-center gap-2 border-t border-subtle pt-4">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-emerald-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M14 7h7v7" />
          </svg>
          <span className="text-[0.8rem] font-semibold">{project.outcome}</span>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-4 py-2 text-xs font-semibold text-[var(--accent)] transition-colors duration-200 hover:bg-[var(--accent)] hover:text-white"
          >
            Read case study
          </button>
          <Link
            href={`/projects/${project.slug}`}
            className="text-xs font-medium text-muted transition-colors duration-200 hover:text-[var(--accent)]"
          >
            Permalink
          </Link>
        </div>
      </div>
    </article>
  );
}
