"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";

interface UploadResponse {
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Drag-and-drop image uploader.
 *
 * Posts the selected file to /api/admin/upload, which re-encodes it to WebP and
 * returns the public URL. The parent owns the value; this component only
 * reports changes, so the same control works for the hero portrait and for
 * project covers.
 */
export default function ImageUploader({
  value,
  onChange,
  label,
  prefix,
  aspect = "aspect-[4/5]",
  allowUrlEntry = true,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  prefix: string;
  aspect?: string;
  allowUrlEntry?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [showUrlField, setShowUrlField] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value);

  /** Uploads one file and hands the resulting URL back to the parent. */
  async function upload(file: File) {
    setBusy(true);
    setError("");

    try {
      const result = await api.upload<UploadResponse>(
        "/api/admin/upload",
        file,
        prefix,
      );
      onChange(result.url);
      setUrlDraft(result.url);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "The upload could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) void upload(file);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold tracking-wide">{label}</span>
        {allowUrlEntry && (
          <button
            type="button"
            onClick={() => setShowUrlField((previous) => !previous)}
            className="text-xs font-medium text-[var(--accent)] transition-opacity duration-200 hover:opacity-75"
          >
            {showUrlField ? "Upload a file instead" : "Paste an image URL"}
          </button>
        )}
      </div>

      {showUrlField ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 rounded-xl border border-subtle bg-[var(--surface-sunken)] px-3.5 py-2.5 text-sm outline-none transition-colors duration-200 focus:border-[var(--accent)]"
          />
          <button
            type="button"
            onClick={() => onChange(urlDraft.trim())}
            className="rounded-xl border border-subtle px-4 py-2.5 text-xs font-semibold transition-colors duration-200 hover:bg-[var(--surface-sunken)]"
          >
            Apply
          </button>
        </div>
      ) : (
        // Click and keyboard both open the file picker; drag-and-drop is a bonus.
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors duration-200 ${
            dragging
              ? "border-[var(--accent)] bg-[var(--accent)]/[0.06]"
              : "border-subtle hover:border-[var(--accent)]/50"
          }`}
        >
          {busy ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]" />
              <span className="text-xs text-secondary">
                Optimising to WebP…
              </span>
            </>
          ) : (
            <>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5-5 5 5M12 5v12" />
              </svg>
              <span className="text-xs font-medium">
                Drop an image or click to browse
              </span>
              <span className="text-[0.7rem] text-muted">
                JPEG, PNG, WebP, AVIF · max 8 MB
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/tiff"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          // Reset so selecting the same file twice still fires a change event.
          event.target.value = "";
        }}
      />

      {error && (
        <p
          role="alert"
          className="mt-2 rounded-lg border border-red-500/30 bg-red-500/[0.07] px-3 py-2 text-xs text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}

      {/* Preview of the current value */}
      {value && !busy && (
        <div className="mt-3 flex items-center gap-3">
          <div
            className={`relative w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-sunken)] ${aspect}`}
          >
            {/* Plain img: this is an admin preview, not a public page asset. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Current selection"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted" title={value}>
              {value}
            </p>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setUrlDraft("");
              }}
              className="mt-1.5 text-xs font-medium text-red-600 transition-opacity duration-200 hover:opacity-75 dark:text-red-400"
            >
              Remove image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
