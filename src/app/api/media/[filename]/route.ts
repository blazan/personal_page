import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

import { resolveMediaPath } from "@/lib/images";

/**
 * Serves processed images from the upload volume.
 *
 * Why not put uploads in /public: the volume must be writable at runtime, and
 * the standalone Docker build copies /public into the image (read-only). A
 * route handler reading from the volume is the reliable way to serve files the
 * admin uploads after the image was built.
 *
 * Streaming the file rather than buffering it keeps memory flat for large
 * images, and the immutable Cache-Control header set in next.config.ts means
 * the browser serves repeat views without hitting this route at all.
 */
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  // resolveMediaPath rejects traversal attempts and returns null on anything
  // that is not a plain filename inside the upload directory.
  const filePath = resolveMediaPath(filename);
  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  let stats;
  try {
    stats = await fs.stat(filePath);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  if (!stats.isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[extension] ?? "application/octet-stream";

  // Convert the Node stream into a web stream for the Response body.
  const stream = Readable.toWeb(
    createReadStream(filePath),
  ) as unknown as ReadableStream<Uint8Array>;

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stats.size),
      // Filenames contain a random token, so the bytes never change for a
      // given URL: cache aggressively.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
