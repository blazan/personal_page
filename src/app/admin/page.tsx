import type { Metadata } from "next";

import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getSession } from "@/lib/auth";
import { getContent, listMessages, listProjects } from "@/lib/db";

/**
 * /admin
 *
 * A server component that decides between the sign-in form and the dashboard
 * based on the session cookie. Because the check happens on the server, an
 * unauthenticated visitor never receives the dashboard markup or the content
 * payload at all — there is nothing to reveal by inspecting the client bundle.
 *
 * `noindex` keeps the panel out of search results.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    return <AdminLogin />;
  }

  // Load everything the dashboard needs in one pass.
  const content = getContent();
  const projects = listProjects();
  const messages = listMessages();

  return (
    <AdminDashboard
      username={session.sub}
      content={content}
      projects={projects}
      messages={messages}
    />
  );
}
