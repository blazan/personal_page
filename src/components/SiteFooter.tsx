import Link from "next/link";

/**
 * Site footer.
 *
 * Kept deliberately quiet: a short line, a link to the admin panel for the
 * owner, and the copyright year computed at render time on the server.
 */
export default function SiteFooter({ name = "Marijana Mandić" }: { name?: string }) {
  return (
    <footer className="border-t border-subtle">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs text-muted sm:flex-row sm:px-8">
        <p>
          © {new Date().getFullYear()} {name}. All rights reserved.
        </p>
        <nav className="flex items-center gap-5" aria-label="Footer">
          <a
            href="#top"
            className="transition-colors duration-200 hover:text-[var(--accent)]"
          >
            Back to top
          </a>
          <Link
            href="/admin"
            className="transition-colors duration-200 hover:text-[var(--accent)]"
          >
            Admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}
