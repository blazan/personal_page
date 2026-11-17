import { NextResponse } from "next/server";

import {
  deleteProject,
  getProjectById,
  updateProject,
  uniqueSlug,
} from "@/lib/db";
import { guard, handle, parseId } from "@/lib/api-helpers";
import { parseProjectInput } from "@/lib/project-input";
import { deleteStoredImageByUrl } from "@/lib/images";
import { readJsonBody } from "@/lib/validation";

/**
 * PUT    /api/admin/projects/:id — replaces a project's fields.
 * DELETE /api/admin/projects/:id — removes a project and its uploaded image.
 */
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guard();
  if (denied) return denied;

  return handle(async () => {
    const { id: rawId } = await params;
    const id = parseId(rawId);

    const existing = getProjectById(id);
    if (!existing) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const parsed = parseProjectInput(await readJsonBody(request));

    // Recompute the slug only when the title actually changed, so existing
    // links keep working after an unrelated edit.
    const slug =
      parsed.title === existing.title
        ? existing.slug
        : uniqueSlug(parsed.title, id);

    const project = updateProject(id, { ...parsed, slug });

    // If the cover was replaced with a different image, remove the old file so
    // the volume does not accumulate orphans. Never delete remote seed URLs.
    if (
      existing.coverImage !== parsed.coverImage &&
      existing.coverImage.startsWith("/api/media/")
    ) {
      await deleteStoredImageByUrl(existing.coverImage);
    }

    return NextResponse.json({ ok: true, project });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guard();
  if (denied) return denied;

  return handle(async () => {
    const { id: rawId } = await params;
    const id = parseId(rawId);

    const existing = getProjectById(id);
    if (!existing) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    deleteProject(id);

    // Clean up an uploaded cover image now that nothing references it.
    if (existing.coverImage.startsWith("/api/media/")) {
      await deleteStoredImageByUrl(existing.coverImage);
    }

    return NextResponse.json({ ok: true });
  });
}
