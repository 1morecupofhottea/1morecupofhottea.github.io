import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "fs";
import {
  getAllProjects,
  getFeaturedProjects,
  getProject,
  getAllBlogPosts,
  getBlogPost,
  estimateReadingTime,
} from "@/lib/content";

afterEach(() => {
  vi.restoreAllMocks();
});

// --- Tests against the real content/ directory -----------------------
// This project has no external CMS — content/*.mdx *is* the data layer, so
// asserting invariants against the real files (rather than only synthetic
// fixtures) directly tests the thing that ships. Assertions are shaped to
// be robust to adding/editing content entries (no hardcoded counts/slugs
// beyond ones that are structural to the site, e.g. sort order).

describe("getAllProjects (real content)", () => {
  it("returns a non-empty array for the default locale", () => {
    const projects = getAllProjects();
    expect(projects.length).toBeGreaterThan(0);
  });

  it("every entry has the required frontmatter fields", () => {
    for (const p of getAllProjects()) {
      expect(typeof p.title).toBe("string");
      expect(p.title.length).toBeGreaterThan(0);
      expect(typeof p.slug).toBe("string");
      expect(p.slug.length).toBeGreaterThan(0);
      expect(typeof p.publishedAt).toBe("string");
      expect(Number.isNaN(new Date(p.publishedAt).getTime())).toBe(false);
      expect(typeof p.category).toBe("string");
      expect(Array.isArray(p.tags)).toBe(true);
      expect(typeof p.image).toBe("string");
      expect(typeof p.description).toBe("string");
    }
  });

  it("is sorted by publishedAt descending (newest first)", () => {
    const projects = getAllProjects();
    for (let i = 0; i < projects.length - 1; i++) {
      const current = new Date(projects[i].publishedAt).getTime();
      const next = new Date(projects[i + 1].publishedAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it("has unique slugs", () => {
    const slugs = getAllProjects().map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("also resolves content for the ja locale without throwing", () => {
    expect(() => getAllProjects("ja")).not.toThrow();
    expect(getAllProjects("ja").length).toBeGreaterThan(0);
  });
});

describe("getFeaturedProjects (real content)", () => {
  it("only returns projects with featured === true", () => {
    for (const p of getFeaturedProjects()) {
      expect(p.featured).toBe(true);
    }
  });

  it("is a subset of getAllProjects", () => {
    const all = new Set(getAllProjects().map((p) => p.slug));
    for (const p of getFeaturedProjects()) {
      expect(all.has(p.slug)).toBe(true);
    }
  });
});

describe("getProject (real content)", () => {
  it("returns full content plus frontmatter for a known slug", () => {
    const [firstProject] = getAllProjects();
    const full = getProject(firstProject.slug);
    expect(full).not.toBeNull();
    expect(full?.slug).toBe(firstProject.slug);
    expect(full?.title).toBe(firstProject.title);
    expect(typeof full?.content).toBe("string");
    expect((full?.content ?? "").length).toBeGreaterThan(0);
  });

  it("returns null for a slug that does not exist", () => {
    expect(getProject("this-slug-definitely-does-not-exist-12345")).toBeNull();
  });
});

describe("getAllBlogPosts (real content)", () => {
  it("returns a non-empty array with required fields", () => {
    const posts = getAllBlogPosts();
    expect(posts.length).toBeGreaterThan(0);
    for (const p of posts) {
      expect(typeof p.title).toBe("string");
      expect(typeof p.slug).toBe("string");
      expect(typeof p.publishedAt).toBe("string");
      expect(Array.isArray(p.tags)).toBe(true);
      expect(typeof p.excerpt).toBe("string");
    }
  });

  it("is sorted by publishedAt descending", () => {
    const posts = getAllBlogPosts();
    for (let i = 0; i < posts.length - 1; i++) {
      const current = new Date(posts[i].publishedAt).getTime();
      const next = new Date(posts[i + 1].publishedAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });
});

describe("getBlogPost (real content)", () => {
  it("returns full content for a known slug", () => {
    const [firstPost] = getAllBlogPosts();
    const full = getBlogPost(firstPost.slug);
    expect(full).not.toBeNull();
    expect(typeof full?.content).toBe("string");
    expect((full?.content ?? "").length).toBeGreaterThan(0);
  });

  it("returns null for an unknown slug", () => {
    expect(getBlogPost("no-such-post-slug")).toBeNull();
  });
});

// --- Edge cases via fs mocking -----------------------------------------
// These isolate behavior that's hard to exercise against real content
// (missing directories) without relying on the fixture repo staying empty
// or non-empty in a particular way.

describe("content.ts edge cases (mocked fs)", () => {
  it("getAllProjects returns [] when the projects directory doesn't exist", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    expect(getAllProjects()).toEqual([]);
  });

  it("getAllBlogPosts returns [] when the blog directory doesn't exist", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    expect(getAllBlogPosts()).toEqual([]);
  });

  it("getProject returns null when existsSync reports the file is missing", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    expect(getProject("anything")).toBeNull();
  });

  it("getBlogPost returns null when existsSync reports the file is missing", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    expect(getBlogPost("anything")).toBeNull();
  });
});

// --- estimateReadingTime (pure) -----------------------------------------

describe("estimateReadingTime", () => {
  const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

  it("rounds up to the nearest minute at 200 words per minute", () => {
    expect(estimateReadingTime(words(200))).toBe("1 min read");
    expect(estimateReadingTime(words(201))).toBe("2 min read");
    expect(estimateReadingTime(words(400))).toBe("2 min read");
    expect(estimateReadingTime(words(401))).toBe("3 min read");
  });

  it("returns at least 1 min read for a short/non-empty input", () => {
    expect(estimateReadingTime("one two three")).toBe("1 min read");
  });

  it("scales for long content", () => {
    expect(estimateReadingTime(words(1000))).toBe("5 min read");
  });
});
