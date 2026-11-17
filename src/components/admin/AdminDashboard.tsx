"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import ContentEditor from "./ContentEditor";
import ProjectsManager from "./ProjectsManager";
import Inbox from "./Inbox";
import ThemeToggle from "../ThemeToggle";
import type { ContactMessage, Project, SiteContent } from "@/lib/types";

type Tab = "content" | "projects" | "inbox";

/**
 * Admin dashboard shell.
 *
 * All three panels are mounted once and toggled with CSS-free conditional
 * rendering, so switching tabs is instant and no data is refetched. The initial
 * data is read on the server and handed down as props, which means the
 * dashboard renders fully populated on first paint.
 */
export default function AdminDashboard({
  username,
  content,
  projects,
  messages,
}: {
  username: string;
  content: SiteContent;
  projects: Project[];
  messages: ContactMessage[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("content");
  const [signingOut, setSigningOut] = useState(false);

  const unreadCount = messages.filter((item) => !item.isRead).length;

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // Refresh so the server component re-renders the login form.
      router.refresh();
    }
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "content", label: "Content" },
    { id: "projects", label: "Projects" },
    { id: "inbox", label: "Inbox", badge: unreadCount },
  ];

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="border-b border-subtle bg-[var(--surface-raised)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-xs font-bold text-white">
              MM
            </span>
            <div>
              <h1 className="text-sm font-semibold">Admin panel</h1>
              <p className="text-[0.7rem] text-muted">Signed in as {username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-subtle px-4 py-2 text-xs font-semibold transition-colors duration-200 hover:bg-[var(--surface-sunken)]"
            >
              View site ↗
            </a>
            <ThemeToggle />
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="rounded-full border border-subtle px-4 py-2 text-xs font-semibold transition-colors duration-200 hover:bg-[var(--surface-sunken)] disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>

        {/* Tab strip */}
        <nav className="mx-auto max-w-6xl px-5 sm:px-8" aria-label="Admin sections">
          <ul className="flex gap-1">
            {tabs.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={tab === item.id ? "page" : undefined}
                  className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                    tab === item.id
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-transparent text-secondary hover:text-[var(--text-primary)]"
                  }`}
                >
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Panel */}
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {tab === "content" && <ContentEditor initial={content} />}
        {tab === "projects" && <ProjectsManager initialProjects={projects} />}
        {tab === "inbox" && <Inbox initialMessages={messages} />}
      </main>
    </div>
  );
}
