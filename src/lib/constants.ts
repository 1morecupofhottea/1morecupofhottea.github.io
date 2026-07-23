import siteData from "../../content/site.json";
import skillsData from "../../content/skills.json";
import jaSkillsData from "../../content/ja/skills.json";
import experienceData from "../../content/experience.json";
import jaExperienceData from "../../content/ja/experience.json";

export const SITE = siteData;

export function getSkillGroups(locale: string) {
  return locale === "ja" ? jaSkillsData : skillsData;
}

export function getExperienceItems(locale: string) {
  return locale === "ja" ? jaExperienceData : experienceData;
}

export const NAV_LINKS = [
  { href: "/#about", label: "about" },
  { href: "/#skills", label: "skills" },
  { href: "/#projects", label: "projects" },
  { href: "/#experience", label: "experience" },
  { href: "/blog", label: "blog" },
  { href: "/craft", label: "craft" },
  { href: "/#contact", label: "contact" },
];
