import Hero from "@/components/Hero";
import MetricsBar from "@/components/MetricsBar";
import About from "@/components/About";
import ProjectsGrid from "@/components/ProjectsGrid";
import Contact from "@/components/Contact";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getContent, listFeaturedProjects } from "@/lib/db";

/**
 * Public homepage.
 *
 * A server component, so all content is read straight from SQLite during the
 * request and rendered to HTML — the browser receives no database client and
 * the page is fully populated on first paint.
 *
 * `dynamic = "force-dynamic"` is deliberate: admin edits must appear on the
 * next request rather than after a rebuild. SQLite reads are sub-millisecond,
 * so the cost of skipping the cache is negligible.
 */
export const dynamic = "force-dynamic";

export default function HomePage() {
  const content = getContent();
  const projects = listFeaturedProjects();

  return (
    <>
      <SiteHeader />
      <main>
        <Hero content={content.hero} />
        <MetricsBar metrics={content.metrics} />
        <About content={content.about} />
        <ProjectsGrid projects={projects} />
        <Contact content={content.contact} />
      </main>
      <SiteFooter />
    </>
  );
}
