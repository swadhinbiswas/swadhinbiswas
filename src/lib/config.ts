// Dynamic configuration loader that fetches from database with fallback to static config
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
} from "../db";

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
  skills: string[];

  bio: {
    focusLabel: string;
    short: string;
    long: string;
    quote: string;
    funFact: string;
    researchStatement: string;
    roleInterests?: string;
  };
}

// Cache for config
let cachedConfig: DynamicSiteConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache

export async function getDynamicConfig(): Promise<DynamicSiteConfig> {
  // Return cached config if still valid
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  try {
    // Fetch all data from database in parallel
    const [
      settingsData,
      socialsData,
      navData,
      experiencesData,
      projectsData,
      achievementsData,
      skillsData,
      bioData,
    ] = await Promise.all([
      db.select().from(siteSettings),
      db.select().from(socialLinks).orderBy(socialLinks.order),
      db.select().from(navigationItems).orderBy(navigationItems.order),
      db.select().from(experiences).orderBy(experiences.order),
      db.select().from(projects).orderBy(projects.order),
      db.select().from(achievements).orderBy(achievements.order),
      db.select().from(skills).orderBy(skills.order),
      db.select().from(bioContent),
    ]);

    // Convert settings to object
    const settings: Record<string, string> = {};
    settingsData.forEach((s) => {
      settings[s.key] = s.value;
    });

    // Convert bio to object
    const bio: Record<string, string> = {};
    bioData.forEach((b) => {
      bio[b.key] = b.value;
    });

    // Parse keywords
    const keywords = settings.seo_keywords
      ? settings.seo_keywords.split(",").map((k) => k.trim())
      : [];

    // Build config
    const config: DynamicSiteConfig = {
      name: settings.site_name || "",
      description: settings.site_description || "",
      url: settings.site_url || "",
      cvUrl: settings.cv_url || "",
      author: settings.author || "",
      email: settings.email || "",
      location: settings.location || "",
      timezone: settings.timezone || "",

      seo: {
        author: settings.author || "",
        title: settings.seo_title || "",
        keywords,
        worksFor: {
          name: settings.works_for_name || "",
          url: settings.works_for_url || "",
        },
        location: { city: "Dhaka", country: "Bangladesh" },
      },

      links: {
        github: socialsData.find((s) => s.icon === "github")?.url || "",
        linkedin: socialsData.find((s) => s.icon === "linkedin")?.url || "",
        twitter: socialsData.find((s) => s.icon === "twitter")?.url || "",
        email: `mailto:${settings.email || ""}`,
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

      skills: skillsData.length > 0 ? skillsData.map((s) => s.name) : [],

      bio: {
        focusLabel: bio.focusLabel || "CURRENT DIRECTIVE",
        short: bio.short || "",
        long: bio.long || "",
        quote: bio.quote || "",
        funFact: bio.funFact || "",
        researchStatement: bio.researchStatement || "",
        roleInterests: bio.roleInterests || "",
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

    // Return static config as fallback
    return {
      name: [],
      description: [],
      url: [],
      cvUrl: [],
      author: [],
      email: [],
      location: { city: "Dhaka", country: "Bangladesh" },
      timezone: [],
      seo: [],
      links: [],
      navItems: [],
      navMenuItems: [],
      socials: [],
      experience: [],
      featuredProjects: [],
      achievements: [],
      skills: [],
      bio: [],
    };
  }
}

// Clear cache (useful after admin updates)
export function clearConfigCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
}
