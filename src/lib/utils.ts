import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const localeMap: Record<string, string> = {
  en: "en-US",
  ja: "ja-JP",
};

export function formatDate(dateString: string, locale = "en"): string {
  return new Date(dateString).toLocaleDateString(localeMap[locale] ?? "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
