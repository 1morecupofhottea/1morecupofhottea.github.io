import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/lib/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { getBlogPost, getAllBlogPosts, estimateReadingTime } from "@/lib/content";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export function generateStaticParams() {
  const locales = ["en", "ja"];
  return locales.flatMap((locale) =>
    getAllBlogPosts().map((p) => ({ locale, slug: p.slug }))
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = getBlogPost(slug, locale);
  if (!post) notFound();

  const readingTime = post.readingTime ?? estimateReadingTime(post.content);
  const t = await getTranslations("BlogDetail");

  return (
    <div className="pt-24 px-6 md:px-8 pb-24">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          {t("backToBlog")}
        </Link>

        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <h1 className="font-bold tracking-tight mb-4" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}>
          {post.title}
        </h1>

        <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-10 pb-8 border-b border-border">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            {formatDate(post.publishedAt, locale)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            {readingTime}
          </span>
        </div>

        <article className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-indigo-600 prose-code:text-indigo-700 prose-code:bg-indigo-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-li:text-muted-foreground prose-p:text-muted-foreground prose-p:leading-relaxed">
          <div
            dangerouslySetInnerHTML={{
              __html: post.content
                .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/^- (.+)$/gm, '<li>$1</li>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/^(?!<[hlu])/gm, '<p>')
                .replace(/(?<![>])$/gm, '</p>'),
            }}
          />
        </article>
      </div>
    </div>
  );
}
