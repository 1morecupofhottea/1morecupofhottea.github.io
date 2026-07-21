"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, Send } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionWrapper } from "@/components/shared/section-wrapper";
import { SectionLabel } from "@/components/shared/section-label";
import { ReelReveal } from "@/components/casino/reel-reveal";
import { useCasino } from "@/components/casino/casino-provider";
import { SITE } from "@/lib/constants";

export function ContactSection() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const t = useTranslations("ContactSection");
  const { playKey } = useCasino();

  function clearValidationMessage(e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.currentTarget.setCustomValidity("");
  }

  function handleNameInvalid(e: React.InvalidEvent<HTMLInputElement>) {
    if (e.currentTarget.validity.valueMissing) {
      e.currentTarget.setCustomValidity(t("nameRequired"));
    }
  }

  function handleEmailInvalid(e: React.InvalidEvent<HTMLInputElement>) {
    if (e.currentTarget.validity.valueMissing) {
      e.currentTarget.setCustomValidity(t("emailRequired"));
    } else if (e.currentTarget.validity.typeMismatch) {
      e.currentTarget.setCustomValidity(t("emailInvalid"));
    }
  }

  function handleMessageInvalid(e: React.InvalidEvent<HTMLTextAreaElement>) {
    if (e.currentTarget.validity.valueMissing) {
      e.currentTarget.setCustomValidity(t("messageRequired"));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };
    try {
      const endpoint = process.env.NEXT_PUBLIC_FORM_ENDPOINT || "/api/contact";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <SectionWrapper id="contact" className="bg-muted/30">
      <SectionLabel number="05" total="05" title={t("title")} />
      <div className="grid md:grid-cols-2 gap-16 items-start">
        <div>
          <h2 className="font-semibold mb-4" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
            <ReelReveal text={t("heading")} speed="medium" playKey={playKey} once={false} />
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {t("description")}
          </p>
          <div className="space-y-4">
            <a
              href={`mailto:${SITE.email}`}
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail size={16} className="text-indigo-600" />
              <ReelReveal text={SITE.email} speed="fast" playKey={playKey} once={false} />
            </a>
            <div className="flex gap-4 pt-2">
              {[
                { icon: GithubIcon, href: SITE.socials.github, key: "github" },
                { icon: LinkedinIcon, href: SITE.socials.linkedin, key: "linkedin" },
              ].map(({ icon: Icon, href, key }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={t(key)}
                >
                  <Icon size={16} />
                  <ReelReveal text={t(key)} speed="fast" playKey={playKey} once={false} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              name="name"
              placeholder={t("namePlaceholder")}
              required
              onInvalid={handleNameInvalid}
              onInput={clearValidationMessage}
            />
            <Input
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              required
              onInvalid={handleEmailInvalid}
              onInput={clearValidationMessage}
            />
          </div>
          <Textarea
            name="message"
            placeholder={t("messagePlaceholder")}
            className="min-h-[140px] resize-none"
            required
            onInvalid={handleMessageInvalid}
            onInput={clearValidationMessage}
          />
          <Button
            type="submit"
            disabled={status === "sending" || status === "sent"}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
          >
            <Send size={14} className="mr-2" />
            {status === "sending" ? t("sending") : status === "sent" ? t("sent") : t("sendMessage")}
          </Button>
          {status === "error" && (
            <p className="text-sm text-destructive">{t("error")}</p>
          )}
        </form>
      </div>
    </SectionWrapper>
  );
}
