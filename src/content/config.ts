import { defineCollection, z } from 'astro:content';

const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.date(),
    tags: z.array(z.string()).optional(),
    github: z.string().optional(),
    demo: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  projects: projectsCollection,
};
