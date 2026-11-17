import { NextResponse } from "next/server";

import { guard } from "@/lib/api-helpers";
import {
  processAndStoreImage,
  InvalidImageError,
  MAX_UPLOAD_BYTES,
} from "@/lib/images";
import { ValidationError } from "@/lib/validation";

/**
 * POST /api/admin/upload
 *
 * Accepts a multipart form with a single `file` field, re-encodes it to WebP
 * at two sizes and returns the public URLs. Used for both the profile portrait
 * and project cover images.
 *
 * The request is authenticated first, so an anonymous visitor cannot fill the
 * disk with images. Size and MIME type are checked again inside
 * processAndStoreImage, which is the function that actually decodes the bytes.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  // The upload route needs its own error mapping (rather than the shared
  // `handle` helper) because a bad image is a client error, not a server one.
  try {
    // Cheap pre-check before buffering the body: the Content-Length header
    // lets an oversized upload be rejected without reading it into memory.
    const declaredLength = Number(request.headers.get("content-length") ?? "0");
    if (declaredLength > MAX_UPLOAD_BYTES + 1024 * 64) {
      throw new InvalidImageError("Image is too large. Maximum is 8 MB.");
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new InvalidImageError(
        "Upload must be sent as multipart/form-data with a 'file' field.",
      );
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new InvalidImageError("No file was included in the upload.");
    }

    // Optional caller-supplied prefix, sanitised inside processAndStoreImage.
    const rawPrefix = formData.get("prefix");
    const prefix = typeof rawPrefix === "string" && rawPrefix ? rawPrefix : "image";

    const stored = await processAndStoreImage(file, prefix);

    return NextResponse.json({
      ok: true,
      url: stored.url,
      thumbnailUrl: stored.thumbnailUrl,
      width: stored.width,
      height: stored.height,
      bytes: stored.bytes,
    });
  } catch (error) {
    if (error instanceof InvalidImageError || error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[upload] failed:", error);
    return NextResponse.json(
      { error: "The upload could not be processed." },
      { status: 500 },
    );
  }
}
