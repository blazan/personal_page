import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Marijana Mandić — Senior Project Manager",
    template: "%s · Marijana Mandić",
  },
  description:
    "Senior Project Manager specialising in digital transformation, Agile and Scrum delivery, and cross-functional team leadership. 98% on-time delivery across 35+ enterprise programmes.",
  keywords: [
    "Senior Project Manager",
    "Digital Transformation",
    "Agile Delivery",
    "Scrum Master",
    "PMP",
    "PRINCE2",
    "Programme Management",
    "Marijana Mandić",
  ],
  authors: [{ name: "Marijana Mandić" }],
  openGraph: {
    title: "Marijana Mandić — Senior Project Manager",
    description:
      "Digital transformation and Agile delivery leadership. 98% on-time delivery, $12M+ budgets managed.",
    type: "website",
    locale: "en_US",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#080f1e" },
  ],
};

/**
 * Runs before React hydrates to apply the stored colour scheme.
 *
 * Without this the page would paint in light mode and then flash to dark once
 * the client bundle loaded. It is inlined and deliberately tiny.
 */
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (e) {
    /* localStorage can throw in private mode; light mode is a safe default. */
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
