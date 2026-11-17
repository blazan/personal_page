/**
 * Sticky site header with in-page navigation.
 *
 * The background gains a blur and a border once the user scrolls past the hero,
 * which keeps the header legible over content without a heavy shadow.
 */
"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];

export default function SiteHeader({ name = "Marijana Mandić" }: { name?: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll(); // sync immediately in case the page loads mid-scroll
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-subtle bg-[var(--surface)]/85 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <a
          href="#top"
          className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[0.7rem] font-bold text-white transition-transform duration-300 group-hover:scale-105">
            MM
          </span>
          <span className="hidden sm:inline">{name}</span>
        </a>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm text-secondary transition-colors duration-200 hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]"
            >
              {link.label}
            </a>
          ))}
          <ThemeToggle className="ml-1" />
        </nav>
      </div>
    </header>
  );
}
