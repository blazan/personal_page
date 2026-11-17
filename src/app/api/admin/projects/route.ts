import { NextResponse } from "next/server";

import { createProject, listProjects, uniqueSlug } from "@/lib/db";
import { guard, handle } from "@/lib/api-helpers";
import { parseProjectInput } from "@/lib/project-input";
import { readJsonBody } from "@/lib/validation";

/**
 * GET  /api/admin/projects — every project, in display order.
 * POST /api/admin/projects — creates a project.
 *
 * The slug is derived from the title on the server so it is always URL-safe and
 * unique; the client never supplies it.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  return NextResponse.json({ projects: listProjects() });
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  return handle(async () => {
    const parsed = parseProjectInput(await readJsonBody(request));

    const project = createProject({
      ...parsed,
      slug: uniqueSlug(parsed.title),
    });

    return NextResponse.json({ ok: true, project }, { status: 201 });
  });
}
