"use client";

/**
 * Thin wrapper around fetch for the admin API.
 *
 * Centralises three things that would otherwise be repeated in every panel:
 * JSON encoding, turning a non-2xx response into a thrown Error carrying the
 * server's message, and treating a 401 as "the session expired" so the UI can
 * bounce the user back to the login form.
 */

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  url: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, ...rest } = init;

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(rest.headers ?? {}),
    },
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
  });

  if (response.status === 401) {
    // Session expired or was revoked: reload so the server component renders
    // the login form again.
    window.location.reload();
    throw new ApiError("Your session has expired.", 401);
  }

  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new ApiError(data.error || "The request failed.", response.status);
  }

  return data;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, json?: unknown) =>
    request<T>(url, { method: "POST", json }),
  put: <T>(url: string, json?: unknown) => request<T>(url, { method: "PUT", json }),
  patch: <T>(url: string, json?: unknown) =>
    request<T>(url, { method: "PATCH", json }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),

  /**
   * Uploads an image. Content-Type is intentionally left unset so the browser
   * adds the multipart boundary itself.
   */
  upload: async <T>(
    url: string,
    file: File,
    prefix?: string,
  ): Promise<T> => {
    const formData = new FormData();
    formData.append("file", file);
    if (prefix) formData.append("prefix", prefix);

    const response = await fetch(url, { method: "POST", body: formData });

    if (response.status === 401) {
      window.location.reload();
      throw new ApiError("Your session has expired.", 401);
    }

    const data = (await response.json().catch(() => ({}))) as T & {
      error?: string;
    };

    if (!response.ok) {
      throw new ApiError(data.error || "Upload failed.", response.status);
    }
    return data;
  },
};
