"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Admin sign-in form.
 *
 * On success the server has already set the HTTP-only session cookie, so the
 * only thing left to do is refresh the route: the server component re-renders
 * and swaps this form for the dashboard.
 */
export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Sign-in failed.");
      }

      // Drop the password from component state as soon as it is no longer needed.
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent)] text-sm font-bold text-white">
            MM
          </span>
          <h1 className="mt-5 text-2xl font-semibold">Admin sign-in</h1>
          <p className="mt-2 text-sm text-secondary">
            Enter the credentials configured in your environment.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="surface-card space-y-5 rounded-2xl p-6"
          noValidate
        >
          <div>
            <label
              htmlFor="admin-username"
              className="mb-2 block text-xs font-semibold tracking-wide"
            >
              Username
            </label>
            <input
              id="admin-username"
              name="username"
              type="text"
              required
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-subtle bg-[var(--surface-sunken)] px-3.5 py-2.5 text-sm outline-none transition-colors duration-200 focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-xs font-semibold tracking-wide"
            >
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-subtle bg-[var(--surface-sunken)] px-3.5 py-2.5 text-sm outline-none transition-colors duration-200 focus:border-[var(--accent)]"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/[0.07] px-3.5 py-2.5 text-xs text-red-700 dark:text-red-400"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          <a
            href="/"
            className="transition-colors duration-200 hover:text-[var(--accent)]"
          >
            ← Back to the public site
          </a>
        </p>
      </div>
    </div>
  );
}
