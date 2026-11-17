import type { MetadataRoute } from "next";

/**
 * robots.txt.
 *
 * The admin panel is excluded from crawling; everything public is allowed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
  };
}
