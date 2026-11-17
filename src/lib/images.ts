// This module is server-only. It reads Node built-ins and native addons that
// cannot be bundled for the browser. It is imported exclusively from server
// components and route handlers, never from a "use client" module.

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Image upload pipeline.
 *
 * Every upload is re-encoded to WebP at two widths (a full-size hero/cover
 * variant and a card thumbnail) and written to a directory on a Docker volume.
 * Re-encoding through sharp also strips EXIF metadata, which removes GPS and
 * camera data that should not be published with a client photo.
 */

/** Where processed images live. Overridable for tests. */
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "uploads");

/**
 * Thrown when the bytes are not a decodable image. The upload route maps this
 * to HTTP 400, distinguishing a bad file from a server fault.
 */
export class InvalidImageError extends Error {}

/** Uploads are capped at 8 MB: generous for a photo, cheap to reject. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** MIME types we are willing to decode. SVG is excluded (it can carry script). */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/tiff",
]);

/** Result of a successful upload. */
export interface StoredImage {
  /** Public URL for the full-size image, e.g. /api/media/abc123.webp. */
  url: string;
  /** Public URL for the 640px card variant. */
  thumbnailUrl: string;
  width: number;
  height: number;
  bytes: number;
}

/** Ensures the upload directory exists and returns its path. */
export async function ensureUploadDir(): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  return UPLOAD_DIR;
}

/**
 * Resolves a stored filename to an absolute path, refusing anything that
 * escapes the upload directory. This blocks `../` traversal in a crafted URL.
 */
export function resolveMediaPath(filename: string): string | null {
  // Only allow a single path segment of safe characters.
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return null;

  const resolved = path.resolve(UPLOAD_DIR, filename);
  const root = path.resolve(UPLOAD_DIR);

  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

/**
 * Validates, re-encodes and stores an uploaded image.
 *
 * @param file     The uploaded File from a multipart form.
 * @param basename Optional prefix for the generated filename.
 */
export async function processAndStoreImage(
  file: File,
  basename = "image",
): Promise<StoredImage> {
  if (file.size === 0) {
    throw new InvalidImageError("The uploaded file is empty.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new InvalidImageError(
      `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 8 MB.`,
    );
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new InvalidImageError(
      `Unsupported image type "${file.type}". Use JPEG, PNG, WebP, AVIF, GIF or TIFF.`,
    );
  }

  const input = Buffer.from(await file.arrayBuffer());

  // `failOn: "error"` makes sharp reject truncated or corrupt files rather than
  // silently producing a half-decoded image.
  const pipeline = sharp(input, { failOn: "error", limitInputPixels: 40_000_000 });

  // sharp reports decode failures as its own error type. Convert them into a
  // validation error so the route answers 400 with a useful message instead of
  // a generic 500.
  let metadata;
  try {
    metadata = await pipeline.metadata();
  } catch {
    throw new InvalidImageError(
      "That file could not be read as an image. It may be corrupt or not a real image.",
    );
  }

  if (!metadata.width || !metadata.height) {
    throw new InvalidImageError("That file could not be read as an image.");
  }

  await ensureUploadDir();

  // Random token in the filename means uploads never collide and can be cached
  // immutably by the browser.
  const token = crypto.randomBytes(8).toString("hex");
  const safeBase = basename.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 40) || "image";
  const fullName = `${safeBase}-${token}.webp`;
  const thumbName = `${safeBase}-${token}-thumb.webp`;

  const fullPath = path.join(UPLOAD_DIR, fullName);
  const thumbPath = path.join(UPLOAD_DIR, thumbName);

  // Re-encoding from the raw buffer (not the pipeline) keeps the two resizes
  // independent; sharp pipelines are single-use. `rotate()` with no argument
  // applies the EXIF orientation before the metadata is stripped, so portrait
  // photos taken on a phone are not saved sideways.
  let fullInfo;
  try {
    fullInfo = await sharp(input, { failOn: "error" })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(fullPath);

    await sharp(input, { failOn: "error" })
      .rotate()
      .resize({ width: 640, height: 480, fit: "cover", position: "centre" })
      .webp({ quality: 78, effort: 4 })
      .toFile(thumbPath);
  } catch {
    // Clean up a partially written full-size file before reporting failure.
    await fs.rm(fullPath, { force: true }).catch(() => {});
    await fs.rm(thumbPath, { force: true }).catch(() => {});
    throw new InvalidImageError(
      "That image could not be converted. Try re-saving it and uploading again.",
    );
  }

  return {
    url: `/api/media/${fullName}`,
    thumbnailUrl: `/api/media/${thumbName}`,
    width: fullInfo.width,
    height: fullInfo.height,
    bytes: fullInfo.size,
  };
}

/**
 * Deletes a previously stored image given its public URL.
 *
 * Only files inside the upload directory are touched, and failures are
 * swallowed: an orphaned file is harmless, whereas a thrown error here would
 * fail an otherwise successful admin save.
 */
export async function deleteStoredImageByUrl(url: string): Promise<void> {
  if (!url.startsWith("/api/media/")) return;

  const filename = url.slice("/api/media/".length);
  const fullPath = resolveMediaPath(filename);
  if (!fullPath) return;

  // Also remove the matching thumbnail variant.
  const thumbPath = fullPath.replace(/\.webp$/, "-thumb.webp");

  await Promise.all([
    fs.rm(fullPath, { force: true }).catch(() => {}),
    fs.rm(thumbPath, { force: true }).catch(() => {}),
  ]);
}
