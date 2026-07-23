import { setRequestLocale, getMessages, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { routing } from "@/../i18n/routing";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CustomCursor } from "@/components/shared/custom-cursor";
import { CasinoProvider } from "@/components/casino/casino-provider";
import { ResumeLoadingProvider } from "@/components/casino/resume-loading-provider";
import { DeferredOverlays } from "@/components/casino/deferred-overlays";
import siteData from "../../../content/site.json";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Site" });

  return {
    title: {
      default: `${siteData.name} — ${t("title")}`,
      template: `%s | ${siteData.name}`,
    },
    description: t("tagline"),
    openGraph: {
      title: `${siteData.name} — ${t("title")}`,
      description: t("tagline"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <CasinoProvider>
        <ResumeLoadingProvider>
          <CustomCursor />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer locale={locale} />
          <DeferredOverlays />
        </ResumeLoadingProvider>
      </CasinoProvider>
    </NextIntlClientProvider>
  );
}
