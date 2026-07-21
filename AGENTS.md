# portfolio — AI Engineer Portfolio

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui v4 (base-nova style) + Framer Motion.

## Commands

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # start production server
npm run lint     # ESLint
```

## Architecture

Single-page home (`/`) with sections (Hero, About, Skills, Featured Projects, Experience Timeline, Contact). Separate routes: `/projects`, `/projects/[slug]`, `/blog`, `/blog/[slug]`, `/about`, `/contact`.

### Content system

All content lives in `content/` — no external CMS:

| File | Purpose |
|---|---|
| `content/site.json` | Name, title, tagline, bio, socials, resume URL |
| `content/skills.json` | Skill groups (title + list) |
| `content/experience.json` | Work experience entries |
| `content/projects/*.mdx` | Projects with YAML frontmatter |
| `content/blog/*.mdx` | Blog posts with YAML frontmatter |

Parsed via `@/lib/content` (gray-matter + fs). **MDX is rendered with custom regex + `dangerouslySetInnerHTML`** — not with next-mdx-remote (the package is installed but unused). The `@/lib/constants` module re-exports the JSON content as typed objects.

### Key conventions

- **Server components by default**. Only files using `useState`, `useEffect`, or Framer Motion get `"use client"`.
- **Dynamic routes** use `Promise<{ slug: string }>` pattern — `await params`.
- All `[slug]` pages export `generateStaticParams`.
- All pages export `metadata` (or `generateMetadata`).
- Path alias `@/*` → `src/*`.
- `cn()` from `@/lib/utils` for class merging (clsx + tailwind-merge).
- Component variants via `class-variance-authority` (cva).
- `use client` spots: Header, Hero, HeroSection components, ContactSection, TechBadge, SectionWrapper, ProjectCard, ProjectFilter.

### Styling

- Tailwind CSS v4: `@import "tailwindcss"` (CSS-first, no `tailwind.config.ts`).
- CSS variables in `globals.css`.
- `@import "tw-animate-css"` and `@import "shadcn/tailwind.css"`.

### Contact form

POST `/api/contact` → Resend. Needs `.env.local`:
```
RESEND_API_KEY=re_xxx
CONTACT_TO_EMAIL=your@email.com
```
Gracefully degrades (logs to console) when `RESEND_API_KEY` is unset.

### Component tree

```
RootLayout (Inter + JetBrains Mono via next/font)
├── Header (sticky, glass on scroll, mobile nav)
├── <main>
│   ├── HomePage → Hero, AboutSection, SkillsSection, FeaturedProjects, ExperienceTimeline, ContactSection
│   ├── ProjectsPage → ProjectFilter (stateful) → ProjectCard
│   ├── ProjectPage (slug, generateStaticParams)
│   ├── BlogPage → inline article cards
│   ├── BlogPostPage (slug, generateStaticParams, prose styling)
│   ├── AboutPage → bio, skills grid, experience list
│   └── ContactPage → ContactSection (form + socials)
└── Footer
```

### shadcn/ui info

- Style: `base-nova` (uses `@base-ui/react` primitives).
- Components in `src/components/ui/`: badge, button, card, input, textarea.
- Icons: Lucide React + custom `@/components/icons` (GitHub, LinkedIn, Twitter SVGs).

### Next.js version note

This repo uses Next.js 16. APIs may differ from earlier versions. If unsure, check `node_modules/next/dist/docs/` before writing code.
