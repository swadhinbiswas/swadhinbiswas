// Shared data loaders — single source of truth for all sections.
// Guarantees:
//  - versioned cache keys (bust stale prod caches on deploy)
//  - empty results are NEVER cached (a transient DB failure can't poison the cache)
//  - L1 in-memory (30s) → L2 Redis → L3 DB, always with a safe fallback
import { db, projects, experiences, education, publications, skills, uses, projectCategories, testimonials, heroMetrics, languages, certifications } from "../db";
import { asc, desc } from "drizzle-orm";
import { getCachedData, setCachedData } from "./redis";

export const CACHE_VERSION = "v2";

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

interface ProjectRow {
  id: number;
  name: string;
  slug: string;
  description: string;
  content: string | null;
  url: string;
  github: string | null;
  image: string | null;
  tags: string[];
  category: string | null;
  featured: boolean;
  status: string | null;
  projectDate: string | null;
  stars: number;
  techStack: string[];
  metrics: Record<string, string>;
  gallery: string[];
  demoUrl: string | null;
  documentation: string | null;
  duration: string | null;
  role: string | null;
  challenges: string | null;
  outcomes: string | null;
  lessonsLearned: string | null;
  teamSize: number | null;
}

export interface Project extends ProjectRow {}

function mapProject(r: any): Project {
  return {
    ...r,
    tags: safeParse<string[]>(r.tags, []),
    techStack: safeParse<string[]>(r.techStack, []),
    metrics: safeParse<Record<string, string>>(r.metrics, {}),
    gallery: safeParse<string[]>(r.gallery, []),
  };
}

function makeLoader<T>(
  key: string,
  fetchFn: () => Promise<T[]>,
  validate: (rows: T[] | null | undefined) => boolean = (rows) => Array.isArray(rows) && rows.length > 0,
) {
  let mem: T[] | null = null;
  let memTs = 0;
  const MEM_TTL = 30_000;

  return async (): Promise<T[]> => {
    if (mem && Date.now() - memTs < MEM_TTL) return mem;
    const cached = await getCachedData(`${CACHE_VERSION}:${key}`);
    if (validate(cached)) {
      mem = cached;
      memTs = Date.now();
      return cached;
    }
    try {
      const rows = await fetchFn();
      if (validate(rows)) {
        mem = rows;
        memTs = Date.now();
        setCachedData(`${CACHE_VERSION}:${key}`, rows, 600).catch(() => {});
      }
      return rows;
    } catch {
      return mem || [];
    }
  };
}

export const getProjects = makeLoader<Project>("projects", async () => {
  const rows = await db.select().from(projects).orderBy(asc(projects.order), desc(projects.stars));
  return rows.map(mapProject);
});

export const getExperiences = makeLoader("experiences", async () => {
  return db.select().from(experiences).orderBy(desc(experiences.startDate));
});

export const getEducation = makeLoader("education", async () => {
  return db.select().from(education).orderBy(asc(education.order));
});

export const getPublications = makeLoader("publications", async () => {
  return db.select().from(publications).orderBy(desc(publications.date));
});

export const getSkills = makeLoader("skills", async () => {
  return db.select().from(skills).orderBy(asc(skills.order));
});

export const getUses = makeLoader("uses", async () => {
  return db.select().from(uses).orderBy(asc(uses.order));
});

export const getCategories = makeLoader("categories", async () => {
  return db.select().from(projectCategories).orderBy(asc(projectCategories.order));
});

export const getTestimonials = makeLoader("testimonials", async () => {
  return db.select().from(testimonials).orderBy(asc(testimonials.order));
});

export const getHeroMetrics = makeLoader("hero_metrics", async () => {
  return db.select().from(heroMetrics).orderBy(asc(heroMetrics.order));
});

export const getLanguages = makeLoader("languages", async () => {
  return db.select().from(languages).orderBy(asc(languages.order));
});

export const getCertifications = makeLoader("certifications", async () => {
  return db.select().from(certifications).orderBy(asc(certifications.order));
});

export function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function projectUrl(p: { slug?: string | null; name: string }): string {
  return `/projects/${p.slug || slugify(p.name)}/`;
}

export function formatDate(s?: string | null, fallback = "Present"): string {
  if (!s) return fallback;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function parseList(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  const str = String(val);
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Fallback: pipe- or newline-separated plain text (admin-friendly input)
  return str.split(/\||\n/).map((l) => l.trim()).filter(Boolean);
}
