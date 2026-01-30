// Dynamic configuration loader that fetches from database with fallback to static config
import { db, siteSettings, socialLinks, navigationItems, experiences, projects, achievements, skills, bioContent } from '../db';
import { siteConfig as staticConfig } from '../config/site';

export interface DynamicSiteConfig {
  name: string;
  description: string;
  url: string;
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
    short: string;
    long: string;
    quote: string;
    funFact: string;
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
    settingsData.forEach(s => {
      settings[s.key] = s.value;
    });
    
    // Convert bio to object
    const bio: Record<string, string> = {};
    bioData.forEach(b => {
      bio[b.key] = b.value;
    });
    
    // Parse keywords
    const keywords = settings.seo_keywords 
      ? settings.seo_keywords.split(',').map(k => k.trim()) 
      : staticConfig.seo.keywords;
    
    // Build config
    const config: DynamicSiteConfig = {
      name: settings.site_name || staticConfig.name,
      description: settings.site_description || staticConfig.description,
      url: settings.site_url || staticConfig.url,
      author: settings.author || staticConfig.author,
      email: settings.email || staticConfig.email,
      location: settings.location || staticConfig.location,
      timezone: settings.timezone || staticConfig.timezone,
      
      seo: {
        author: settings.author || staticConfig.seo.author,
        title: settings.seo_title || staticConfig.seo.title,
        keywords,
        worksFor: {
          name: settings.works_for_name || staticConfig.seo.worksFor.name,
          url: settings.works_for_url || staticConfig.seo.worksFor.url,
        },
        location: staticConfig.seo.location,
      },
      
      links: {
        github: socialsData.find(s => s.icon === 'github')?.url || staticConfig.links.github,
        linkedin: socialsData.find(s => s.icon === 'linkedin')?.url || staticConfig.links.linkedin,
        twitter: socialsData.find(s => s.icon === 'twitter')?.url || staticConfig.links.twitter,
        email: `mailto:${settings.email || staticConfig.email}`,
      },
      
      navItems: navData.length > 0 
        ? navData.filter(n => n.location === 'header' || n.location === 'both').map(n => ({
            label: n.label,
            href: n.href,
            external: n.external || false,
          }))
        : staticConfig.navItems,
      
      navMenuItems: navData.length > 0 
        ? navData.filter(n => n.location === 'menu' || n.location === 'both').map(n => ({
            label: n.label,
            href: n.href,
            external: n.external || false,
          }))
        : staticConfig.navMenuItems,
      
      socials: socialsData.length > 0 
        ? socialsData.map(s => ({
            name: s.name,
            url: s.url,
            icon: s.icon,
            footer: s.footer || false,
          }))
        : staticConfig.socials,
      
      experience: experiencesData.length > 0 
        ? experiencesData.map(e => ({
            company: e.company,
            role: e.role,
            url: e.url,
            logoUrl: e.logoUrl || undefined,
            startDate: e.startDate,
            endDate: e.endDate || undefined,
            details: e.details || undefined,
          }))
        : staticConfig.experience,
      
      featuredProjects: projectsData.length > 0 
        ? projectsData.filter(p => p.featured).map(p => ({
            name: p.name,
            description: p.description,
            url: p.url,
            github: p.github || undefined,
            image: p.image || undefined,
            tags: JSON.parse(p.tags || '[]'),
            featured: p.featured || false,
            stars: p.stars || 0,
          }))
        : staticConfig.featuredProjects,
      
      achievements: achievementsData.length > 0 
        ? achievementsData.map(a => ({
            name: a.name,
            icon: a.icon,
            description: a.description,
          }))
        : staticConfig.achievements,
      
      skills: skillsData.length > 0 
        ? skillsData.map(s => s.name)
        : staticConfig.skills,
      
      bio: {
        short: bio.short || staticConfig.bio.short,
        long: bio.long || staticConfig.bio.long,
        quote: bio.quote || staticConfig.bio.quote,
        funFact: bio.funFact || staticConfig.bio.funFact,
      },
    };
    
    // Update cache
    cachedConfig = config;
    cacheTimestamp = Date.now();
    
    return config;
  } catch (error) {
    console.error('Error loading dynamic config, falling back to static:', error);
    
    // Return static config as fallback
    return {
      name: staticConfig.name,
      description: staticConfig.description,
      url: staticConfig.url,
      author: staticConfig.author,
      email: staticConfig.email,
      location: staticConfig.location,
      timezone: staticConfig.timezone,
      seo: staticConfig.seo,
      links: staticConfig.links,
      navItems: staticConfig.navItems,
      navMenuItems: staticConfig.navMenuItems,
      socials: staticConfig.socials,
      experience: staticConfig.experience,
      featuredProjects: staticConfig.featuredProjects,
      achievements: staticConfig.achievements,
      skills: staticConfig.skills,
      bio: staticConfig.bio,
    };
  }
}

// Clear cache (useful after admin updates)
export function clearConfigCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
}
