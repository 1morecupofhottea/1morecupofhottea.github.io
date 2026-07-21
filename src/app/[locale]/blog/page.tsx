import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/lib/navigation";
import { Calendar, Clock } from "lucide-react";
import { getAllBlogPosts } from "@/lib/content";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BlogPage" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const posts = getAllBlogPosts(locale);
  const t = await getTranslations("BlogPage");

  return (
    <div className="pt-24 px-6 md:px-8 pb-24">
      <div className="max-w-[72rem] mx-auto">
        <div className="mb-12">
          <p className="text-sm font-medium tracking-widest text-indigo-600 uppercase mb-3">
            {t("label")}
          </p>
          <h1 className="font-bold tracking-tight mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            {t("title")}
          </h1>
          <p className="text-muted-foreground max-w-xl">
            {t("description")}
          </p>
        </div>

        <div className="max-w-3xl space-y-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group border-b border-border pb-8 last:border-0"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="font-semibold text-xl mb-2 group-hover:text-indigo-600 transition-colors">
                  {post.title}
                </h2>
              </Link>
              <p className="text-muted-foreground mb-4 leading-relaxed">{post.excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {formatDate(post.publishedAt, locale)}
                </span>
                {post.readingTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {post.readingTime}
                  </span>
                )}
                <Link
                  href={`/blog/${post.slug}`}
                  className="ml-auto text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {t("readMore")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
