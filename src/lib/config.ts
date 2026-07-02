// Dynamic configuration loader: DB → .env → empty string
import {
  db,
  siteSettings,
  socialLinks,
  navigationItems,
  experiences,
  projects,
  achievements,
  skills,
  bioContent,
  testimonials,
  heroMetrics,
} from "../db";
import { env } from "./env";

export interface DynamicSiteConfig {
  name: string;
  description: string;
  url: string;
  cvUrl?: string;
  author: string;
  email: string;
  location: string;
  timezone: string;

  seo: {
    author: string;
    title: string;
    keywords: string[];
    worksFor: {
      name: string;
      url: string;
    };
    location: {
      city: string;
      country: string;
    };
  };

  links: {
    github: string;
    linkedin: string;
    twitter: string;
    youtube?: string;
    [key: string]: string;
  };

  navItems: Array<{ label: string; href: string; external?: boolean }>;
  navMenuItems: Array<{ label: string; href: string; external?: boolean }>;
  socials: Array<{ name: string; url: string; icon: string; footer?: boolean }>;
  experience: Array<{
    company: string;
    role: string;
    url: string;
    logoUrl?: string;
    startDate: string;
    endDate?: string;
    details?: string;
  }>;
  featuredProjects: Array<{
    name: string;
    description: string;
    url: string;
    github?: string;
    image?: string;
    tags: string[];
    featured?: boolean;
    stars?: number;
  }>;
  achievements: Array<{ name: string; icon: string; description: string }>;
  skills: Array<{ name: string; category?: string; description?: string }>;
  testimonials: Array<{ quote: string; name: string; role: string }>;
  heroMetrics: Array<{ label: string; value: string; sub: string }>;

  highlights: string[];
  languages: string;

  bio: {
    focusLabel: string;
    short: string;
    long: string;
    intro: string;
    story: string;
    quote: string;
    funFact: string;
    researchStatement: string;
    roleInterests?: string;
    summary?: string;
  };
}

// Cache for config
let cachedConfig: DynamicSiteConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache
const DEFAULT_SHORT_BIO = "";
const DEFAULT_FOCUS_LABEL = "FOCUS";
const DEFAULT_RESEARCH_STATEMENT = "";

/**
 * Split "Dhaka, Bangladesh" → { city: "Dhaka", country: "Bangladesh" }
 */
function parseLocation(raw: string): { city: string; country: string } {
  if (!raw) return { city: "", country: "" };
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  return {
    city: parts[0] || "",
    country: parts.slice(1).join(", ") || "",
  };
}

export async function getDynamicConfig(): Promise<DynamicSiteConfig> {
  // Return cached config if still valid
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  /**
   * Run a single DB query and silently fall back to an empty array on failure.
   * A missing or renamed table should never break the whole config — we just
   * lose that one slice and keep the rest. The outer try/catch is the
   * last-resort fallback to .env defaults.
   */
  async function safeSelect<T>(label: string, q: Promise<T[]>): Promise<T[]> {
    try {
      return await q;
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        const msg = e instanceof Error ? e.message : String(e);
        if (/no such table/i.test(msg)) {
          console.warn(`[config] table missing for "${label}", using empty fallback`);
        } else {
          console.warn(`[config] "${label}" query failed:`, msg);
        }
      }
      return [];
    }
  }

  try {
    // Fetch all data from database in parallel. Each query is independently
    // guarded so one missing table doesn't kill the whole batch.
    const [
      settingsData,
      socialsData,
      navData,
      experiencesData,
      projectsData,
      achievementsData,
      skillsData,
      bioData,
      testimonialsData,
      heroMetricsData,
    ] = await Promise.all([
      safeSelect("siteSettings", db.select().from(siteSettings)),
      safeSelect("socialLinks", db.select().from(socialLinks).orderBy(socialLinks.order)),
      safeSelect("navigationItems", db.select().from(navigationItems).orderBy(navigationItems.order)),
      safeSelect("experiences", db.select().from(experiences).orderBy(experiences.order)),
      safeSelect("projects", db.select().from(projects).orderBy(projects.order)),
      safeSelect("achievements", db.select().from(achievements).orderBy(achievements.order)),
      safeSelect("skills", db.select().from(skills).orderBy(skills.order)),
      safeSelect("bioContent", db.select().from(bioContent)),
      safeSelect("testimonials", db.select().from(testimonials).orderBy(testimonials.order)),
      safeSelect("heroMetrics", db.select().from(heroMetrics).orderBy(heroMetrics.order)),
    ]);

    // Convert settings to object
    const settings: Record<string, string> = {};
    settingsData.forEach((s: any) => {
      settings[s.key] = s.value;
    });

    // Convert bio to object
    const bio: Record<string, string> = {};
    bioData.forEach((b: any) => {
      bio[b.key] = b.value;
    });

    const cleanValue = (value?: string) => value?.trim() || "";
    const shortBio = cleanValue(bio.short) || DEFAULT_SHORT_BIO;
    const focusLabel = cleanValue(bio.focusLabel) || DEFAULT_FOCUS_LABEL;
    const researchStatement =
      cleanValue(bio.researchStatement) ||
      cleanValue(bio.roleInterests) ||
      shortBio;

    // Parse keywords
    const keywords = settings.seo_keywords
      ? settings.seo_keywords.split(",").map((k) => k.trim())
      : [];

    // Build config — DB first, .env as fallback, empty string last
    const config: DynamicSiteConfig = {
      name: settings.site_name || env.siteName,
      description: settings.site_description || env.siteDescription,
      url: settings.site_url || env.siteUrl,
      cvUrl: settings.cv_url || "",
      author: settings.author || env.siteName,
      email: settings.email || env.email,
      location: settings.location || env.location,
      timezone: settings.timezone || env.timezone,

      seo: {
        author: settings.author || env.siteName,
        title: settings.seo_title || "",
        keywords,
        worksFor: {
          name: settings.works_for_name || "",
          url: settings.works_for_url || "",
        },
        location: parseLocation(settings.location || env.location),
      },

      links: {
        github: socialsData.find((s) => s.icon === "github")?.url || env.github,
        linkedin: socialsData.find((s) => s.icon === "linkedin")?.url || env.linkedin,
        twitter: socialsData.find((s) => s.icon === "twitter")?.url || env.twitter,
        youtube: socialsData.find((s) => s.icon === "youtube")?.url || env.youtube,
        email: `mailto:${settings.email || env.email}`,
      },

      navItems:
        navData.length > 0
          ? navData
              .filter((n) => n.location === "header" || n.location === "both")
              .map((n) => ({
                label: n.label,
                href: n.href,
                external: n.external || false,
              }))
          : [],

      navMenuItems:
        navData.length > 0
          ? navData
              .filter((n) => n.location === "menu" || n.location === "both")
              .map((n) => ({
                label: n.label,
                href: n.href,
                external: n.external || false,
              }))
          : [],

      socials:
        socialsData.length > 0
          ? socialsData.map((s) => ({
              name: s.name,
              url: s.url,
              icon: s.icon,
              footer: s.footer || false,
            }))
          : [],

      experience:
        experiencesData.length > 0
          ? experiencesData.map((e) => ({
              company: e.company,
              role: e.role,
              url: e.url,
              logoUrl: e.logoUrl || undefined,
              startDate: e.startDate,
              endDate: e.endDate || undefined,
              details: e.details || undefined,
            }))
          : [],

      featuredProjects:
        projectsData.length > 0
          ? projectsData
              .filter((p) => p.featured)
              .map((p) => ({
                name: p.name,
                description: p.description,
                url: p.url,
                github: p.github || undefined,
                image: p.image || undefined,
                tags: JSON.parse(p.tags || "[]"),
                featured: p.featured || false,
                stars: p.stars || 0,
              }))
          : [],

      achievements:
        achievementsData.length > 0
          ? achievementsData.map((a) => ({
              name: a.name,
              icon: a.icon,
              description: a.description,
            }))
          : [],

      skills: skillsData.length > 0 ? skillsData.map((s) => ({ name: s.name, category: s.category || undefined, description: s.description || undefined })) : [],

      testimonials: testimonialsData.length > 0
        ? testimonialsData.map((t) => ({ quote: t.quote, name: t.name, role: t.role }))
        : [],
      heroMetrics: heroMetricsData.length > 0
        ? heroMetricsData.map((m) => ({ label: m.label, value: m.value, sub: m.sub }))
        : [],

      highlights: settings.highlights
        ? settings.highlights.split(",").map((h: string) => h.trim()).filter(Boolean)
        : [],
      languages: settings.languages || "",

      bio: {
        focusLabel,
        short: shortBio,
        long: bio.long || "",
        intro: bio.intro || "",
        story: bio.story || "",
        quote: bio.quote || "",
        funFact: bio.funFact || "",
        researchStatement,
        roleInterests: cleanValue(bio.roleInterests),
        summary: cleanValue(bio.summary),
      },
    };

    // Update cache
    cachedConfig = config;
    cacheTimestamp = Date.now();

    return config;
  } catch (error) {
    console.error(
      "Error loading dynamic config, falling back to static:",
      error,
    );

    // Return safe defaults from .env (DB is the source of truth but env is the bootstrap fallback)
    return {
      name: env.siteName,
      description: env.siteDescription,
      url: env.siteUrl,
      cvUrl: "",
      author: env.siteName,
      email: env.email,
      location: env.location,
      timezone: env.timezone,
      seo: {
        author: env.siteName,
        title: "",
        keywords: [],
        worksFor: { name: "", url: "" },
        location: parseLocation(env.location),
      },
      links: {
        github: env.github,
        linkedin: env.linkedin,
        twitter: env.twitter,
        youtube: env.youtube,
        email: `mailto:${env.email}`,
      },
      navItems: [],
      navMenuItems: [],
      socials: [],
      experience: [],
      featuredProjects: [],
      achievements: [],
      skills: [],
      testimonials: [],
      heroMetrics: [],
      highlights: [],
      languages: "",
      bio: {
        focusLabel: DEFAULT_FOCUS_LABEL,
        short: DEFAULT_SHORT_BIO,
        long: "",
        intro: "",
        story: "",
        quote: "",
        funFact: "",
        researchStatement: DEFAULT_RESEARCH_STATEMENT,
        roleInterests: "",
      },
    };
  }
}

// Clear cache (useful after admin updates)
export function clearConfigCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
}
