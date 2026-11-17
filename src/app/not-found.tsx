import Link from "next/link";

/**
 * Global 404 page.
 *
 * Reached when a case-study slug does not exist. It offers the two useful
 * destinations rather than a dead end.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-secondary">
          The page you were looking for does not exist, or the case study has
          been removed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110"
          >
            Back to home
          </Link>
          <Link
            href="/#projects"
            className="inline-flex items-center gap-2 rounded-full border border-subtle px-6 py-3 text-sm font-semibold transition-colors duration-200 hover:bg-[var(--surface-sunken)]"
          >
            View projects
          </Link>
        </div>
      </div>
    </main>
  );
}
