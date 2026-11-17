"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import ImageUploader from "./ImageUploader";
import {
  Button,
  CheckboxField,
  ListField,
  StatusBanner,
  TextAreaField,
  TextField,
} from "./FormFields";
import type { Project } from "@/lib/types";

/** The editable shape of a project in the form (all strings/lists, no ids). */
interface ProjectDraft {
  title: string;
  category: string;
  client: string;
  summary: string;
  outcome: string;
  challenge: string;
  strategy: string;
  tools: string[];
  results: string[];
  coverImage: string;
  year: string;
  featured: boolean;
}

/** A blank draft used when adding a project. */
const EMPTY_DRAFT: ProjectDraft = {
  title: "",
  category: "",
  client: "",
  summary: "",
  outcome: "",
  challenge: "",
  strategy: "",
  tools: [],
  results: [],
  coverImage: "",
  year: "",
  featured: true,
};

/** Converts a stored project into the form draft shape. */
function toDraft(project: Project): ProjectDraft {
  return {
    title: project.title,
    category: project.category,
    client: project.client,
    summary: project.summary,
    outcome: project.outcome,
    challenge: project.challenge,
    strategy: project.strategy,
    tools: project.tools,
    results: project.results,
    coverImage: project.coverImage,
    year: project.year,
    featured: project.featured,
  };
}

/**
 * Project manager: list, create, edit, reorder and delete.
 *
 * Two views live in one component: the list, and the editor form. Keeping them
 * together avoids a router round-trip for editing and means the list state is
 * already in memory when the editor closes.
 */
export default function ProjectsManager({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [editing, setEditing] = useState<{ id: number | null; draft: ProjectDraft } | null>(
    null,
  );
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  /** Re-reads the authoritative list from the server. */
  async function refresh() {
    const result = await api.get<{ projects: Project[] }>("/api/admin/projects");
    setProjects(result.projects);
  }

  /** Deletes a project after an explicit confirmation. */
  async function remove(project: Project) {
    if (
      !window.confirm(
        `Delete "${project.title}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusyId(project.id);
    setMessage(null);
    try {
      await api.delete(`/api/admin/projects/${project.id}`);
      await refresh();
      setMessage({ tone: "success", text: `"${project.title}" was deleted.` });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Delete failed.",
      });
    } finally {
      setBusyId(null);
    }
  }

  /**
   * Moves a project up or down in the list and persists the new order.
   * The whole order is sent, so the server never has to infer intent.
   */
  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= projects.length) return;

    const reordered = [...projects];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    // Optimistic update: the list reorders instantly, then we reconcile.
    setProjects(reordered);

    try {
      const result = await api.post<{ projects: Project[] }>(
        "/api/admin/projects/reorder",
        { ids: reordered.map((project) => project.id) },
      );
      setProjects(result.projects);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Reorder failed.",
      });
      // Roll back to the server's truth.
      await refresh().catch(() => {});
    }
  }

  async function toggleFeatured(project: Project) {
    setBusyId(project.id);
    try {
      await api.put(`/api/admin/projects/${project.id}`, {
        ...toDraft(project),
        featured: !project.featured,
      });
      await refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Update failed.",
      });
    } finally {
      setBusyId(null);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Editor view                                                            */
  /* ---------------------------------------------------------------------- */
  if (editing) {
    return (
      <ProjectEditor
        projectId={editing.id}
        draft={editing.draft}
        onCancel={() => setEditing(null)}
        onSaved={async (saved) => {
          await refresh();
          setEditing(null);
          setMessage({
            tone: "success",
            text: `"${saved.title}" was saved.`,
          });
        }}
      />
    );
  }

  /* ---------------------------------------------------------------------- */
  /* List view                                                              */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-secondary">
          {projects.length} project{projects.length === 1 ? "" : "s"}. Use the
          arrows to control the order shown on the site.
        </p>
        <Button onClick={() => setEditing({ id: null, draft: { ...EMPTY_DRAFT } })}>
          + New project
        </Button>
      </div>

      {message && <StatusBanner tone={message.tone}>{message.text}</StatusBanner>}

      {projects.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-subtle p-8 text-center text-sm text-muted">
          No projects yet. Add the first one to populate the homepage grid.
        </p>
      ) : (
        <ul className="space-y-3">
          {projects.map((project, index) => (
            <li
              key={project.id}
              className="surface-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center"
            >
              {/* Thumbnail */}
              <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-xl bg-[var(--surface-sunken)] sm:h-16 sm:w-24">
                {project.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.coverImage}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              {/* Summary */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{project.title}</h3>
                  {project.featured ? (
                    <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700 dark:text-emerald-400">
                      Featured
                    </span>
                  ) : (
                    <span className="rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-[0.65rem] font-medium text-muted">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-muted">
                  {project.category} · {project.client}
                </p>
                <p className="mt-1 truncate text-xs text-secondary">
                  {project.outcome}
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${project.title} up`}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-subtle transition-colors duration-200 hover:bg-[var(--surface-sunken)] disabled:opacity-35"
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
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === projects.length - 1}
                  aria-label={`Move ${project.title} down`}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-subtle transition-colors duration-200 hover:bg-[var(--surface-sunken)] disabled:opacity-35"
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
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busyId === project.id}
                  onClick={() => toggleFeatured(project)}
                >
                  {project.featured ? "Hide" : "Feature"}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setEditing({ id: project.id, draft: toDraft(project) })
                  }
                >
                  Edit
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  disabled={busyId === project.id}
                  onClick={() => remove(project)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Editor form                                                                */
/* -------------------------------------------------------------------------- */

function ProjectEditor({
  projectId,
  draft: initialDraft,
  onCancel,
  onSaved,
}: {
  projectId: number | null;
  draft: ProjectDraft;
  onCancel: () => void;
  onSaved: (project: Project) => void;
}) {
  const [draft, setDraft] = useState<ProjectDraft>(initialDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof ProjectDraft>(
    key: K,
    value: ProjectDraft[K],
  ) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const result = projectId
        ? await api.put<{ project: Project }>(
            `/api/admin/projects/${projectId}`,
            draft,
          )
        : await api.post<{ project: Project }>("/api/admin/projects", draft);

      onSaved(result.project);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {projectId ? "Edit project" : "New project"}
        </h2>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          ← Back to list
        </Button>
      </div>

      <div className="surface-card space-y-5 rounded-2xl p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Title"
            value={draft.title}
            onChange={(title) => update("title", title)}
            placeholder="Enterprise ERP Migration"
            maxLength={160}
          />
          <TextField
            label="Category / tag"
            value={draft.category}
            onChange={(category) => update("category", category)}
            placeholder="Digital Transformation"
            maxLength={80}
          />
          <TextField
            label="Client / industry"
            value={draft.client}
            onChange={(client) => update("client", client)}
            placeholder="Nordwind Logistics · 4,000 employees"
            maxLength={160}
          />
          <TextField
            label="Year / period"
            value={draft.year}
            onChange={(year) => update("year", year)}
            placeholder="2022 — 2024"
            maxLength={40}
          />
        </div>

        <TextAreaField
          label="Brief summary"
          rows={3}
          value={draft.summary}
          onChange={(summary) => update("summary", summary)}
          hint="One or two sentences shown on the project card."
          maxLength={600}
        />

        <TextField
          label="Key outcome metric"
          value={draft.outcome}
          onChange={(outcome) => update("outcome", outcome)}
          placeholder="Reduced operational costs by 24%"
          hint="The single headline result, shown on the card and in the case study."
          maxLength={200}
        />

        <TextAreaField
          label="Challenge"
          rows={5}
          value={draft.challenge}
          onChange={(challenge) => update("challenge", challenge)}
          maxLength={4000}
        />

        <TextAreaField
          label="Strategy & execution"
          rows={6}
          value={draft.strategy}
          onChange={(strategy) => update("strategy", strategy)}
          maxLength={6000}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <ListField
            label="Tools used"
            rows={6}
            value={draft.tools}
            onChange={(tools) => update("tools", tools)}
            hint="One tool per line, e.g. Jira."
          />
          <ListField
            label="Results"
            rows={6}
            value={draft.results}
            onChange={(results) => update("results", results)}
            hint="One quantified result per line."
          />
        </div>

        <CheckboxField
          label="Show on the homepage"
          checked={draft.featured}
          onChange={(featured) => update("featured", featured)}
          hint="Unfeatured projects are still reachable by their own URL."
        />

        <ImageUploader
          label="Cover image"
          prefix="project"
          aspect="aspect-[16/10]"
          value={draft.coverImage}
          onChange={(coverImage) => update("coverImage", coverImage)}
        />

        {error && <StatusBanner tone="error">{error}</StatusBanner>}

        <div className="flex items-center gap-3 border-t border-subtle pt-5">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving…
              </>
            ) : projectId ? (
              "Save project"
            ) : (
              "Create project"
            )}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
