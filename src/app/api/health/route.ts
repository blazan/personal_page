import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Liveness probe used by the Docker healthcheck. It deliberately touches the
 * database so a container with an unwritable data volume is reported as
 * unhealthy rather than silently serving errors.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { ping } = await import("@/lib/db");
    ping();
    return NextResponse.json({ status: "ok", uptime: process.uptime() });
  } catch (error) {
    console.error("[health] database check failed:", error);
    return NextResponse.json({ status: "unhealthy" }, { status: 503 });
  }
}
