import { NextResponse } from "next/server";

import { reorderProjects } from "@/lib/db";
import { guard, handle } from "@/lib/api-helpers";
import { asObject, readJsonBody, ValidationError } from "@/lib/validation";

/**
 * POST /api/admin/projects/reorder
 *
 * Persists the drag-and-drop order from the admin project list. The client
 * sends the complete list of ids in the desired order; anything not mentioned
 * keeps its relative position afterwards.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  return handle(async () => {
    const body = asObject(await readJsonBody(request));

    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      throw new ValidationError("An ordered list of project ids is required.");
    }

    const ids = body.ids.map((value) => {
      const id = Number(value);
      if (!Number.isInteger(id) || id <= 0) {
        throw new ValidationError("Project ids must be positive integers.");
      }
      return id;
    });

    const projects = reorderProjects(ids);
    return NextResponse.json({ ok: true, projects });
  });
}
