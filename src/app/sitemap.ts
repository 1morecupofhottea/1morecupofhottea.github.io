import type { MetadataRoute } from "next";
import { getAllProjects, getAllBlogPosts } from "@/lib/content";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://1morecupofhottea.github.io";
const LOCALES = ["en", "ja"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    const prefix = `/${locale}`;
    const projects = getAllProjects(locale).map((p) => ({
      url: `${BASE_URL}${prefix}/projects/${p.slug}`,
      lastModified: new Date(p.publishedAt),
    }));

    const posts = getAllBlogPosts(locale).map((p) => ({
      url: `${BASE_URL}${prefix}/blog/${p.slug}`,
      lastModified: new Date(p.publishedAt),
    }));

    entries.push(
      { url: `${BASE_URL}${prefix}`, lastModified: new Date() },
      { url: `${BASE_URL}${prefix}/projects`, lastModified: new Date() },
      { url: `${BASE_URL}${prefix}/blog`, lastModified: new Date() },
      { url: `${BASE_URL}${prefix}/about`, lastModified: new Date() },
      { url: `${BASE_URL}${prefix}/contact`, lastModified: new Date() },
      ...projects,
      ...posts
    );
  }

  return entries;
}
