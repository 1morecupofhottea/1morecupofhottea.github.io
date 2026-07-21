import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");

export interface ProjectFrontmatter {
  title: string;
  slug: string;
  publishedAt: string;
  category: string;
  tags: string[];
  image: string;
  github?: string;
  demo?: string;
  featured?: boolean;
  description: string;
}

export interface BlogFrontmatter {
  title: string;
  slug: string;
  publishedAt: string;
  tags: string[];
  image?: string;
  excerpt: string;
  readingTime?: string;
}

export interface ProjectData extends ProjectFrontmatter {
  content: string;
}

export interface BlogData extends BlogFrontmatter {
  content: string;
}

function getContentDir(locale: string) {
  return locale === "ja" ? "ja" : "";
}

function getLocaleBase(locale: string) {
  const lc = getContentDir(locale);
  return lc ? path.join(contentDir, lc) : contentDir;
}

export function getAllProjects(locale = "en"): ProjectFrontmatter[] {
  const base = getLocaleBase(locale);
  const dir = path.join(base, "projects");
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data } = matter(raw);
      return data as ProjectFrontmatter;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getFeaturedProjects(locale = "en"): ProjectFrontmatter[] {
  return getAllProjects(locale).filter((p) => p.featured);
}

export function getProject(slug: string, locale = "en"): ProjectData | null {
  const base = getLocaleBase(locale);
  const filePath = path.join(base, "projects", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { ...(data as ProjectFrontmatter), content };
}

export function getAllBlogPosts(locale = "en"): BlogFrontmatter[] {
  const base = getLocaleBase(locale);
  const dir = path.join(base, "blog");
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data } = matter(raw);
      return data as BlogFrontmatter;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getBlogPost(slug: string, locale = "en"): BlogData | null {
  const base = getLocaleBase(locale);
  const filePath = path.join(base, "blog", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { ...(data as BlogFrontmatter), content };
}

export function estimateReadingTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}
