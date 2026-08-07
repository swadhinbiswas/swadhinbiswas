// Project categories — sourced from the database (project_categories table).
import { getCategories } from "./loaders";

export interface ProjectCategory {
  slug: string;
  label: string;
  short: string;
  description: string;
}

export const DEFAULT_CATEGORY = "data-engineering";

export async function getProjectCategories(): Promise<ProjectCategory[]> {
  return getCategories();
}

export function categoryBySlug(
  categories: ProjectCategory[],
  slug?: string | null,
): ProjectCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

export function categoryLabel(
  categories: ProjectCategory[],
  slug?: string | null,
): string {
  return categoryBySlug(categories, slug)?.label || "Project";
}
