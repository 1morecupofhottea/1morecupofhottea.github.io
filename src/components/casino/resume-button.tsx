"use client";

import { SITE } from "@/lib/constants";
import { useResumeLoading } from "@/components/casino/resume-loading-provider";

/**
 * Resume link that triggers the shared loading flash on click before the PDF
 * opens in a new tab. Client component so it can be dropped into server
 * components (e.g. app/about/page.tsx) that can't call the hook directly.
 */
export function ResumeButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { trigger } = useResumeLoading();

  return (
    <a
      href={SITE.resumeUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trigger}
      className={className}
    >
      {children}
    </a>
  );
}
