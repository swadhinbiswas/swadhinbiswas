import type { APIRoute } from 'astro';
import { db, projects } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

// GET all projects
export const GET: APIRoute = async () => {
  try {
    const proj = await db.select().from(projects).orderBy(projects.order);

    // Parse tags from JSON string
    const projectsWithTags = proj.map(p => ({
      ...p,
      tags: JSON.parse(p.tags || '[]'),
    }));

    return new Response(JSON.stringify({ success: true, data: projectsWithTags }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch projects' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST to create new project
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, description, content, url, github, image, tags = [], featured = false, stars = 0, order = 0, status = 'Active' } = body;

    if (!name || !description || !url) {
      return new Response(JSON.stringify({ success: false, error: 'Name, description, and URL are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    const result = await db.insert(projects).values({
      name,
      description,
      content: content || '',
      url,
      github: github || null,
      image: image || null,
      tags: JSON.stringify(tags),
      featured,
      stars,
      order,
      status,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return new Response(JSON.stringify({ success: true, data: { ...result[0], tags } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create project error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT to update project
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name, description, content, url, github, image, tags = [], featured, stars, order, status } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Project ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    const result = await db.update(projects)
      .set({
        name,
        description,
        content: content || '',
        url,
        github: github || null,
        image: image || null,
        tags: JSON.stringify(tags),
        featured,
        stars,
        order,
        status: status || 'Active',
        updatedAt: now
      })
      .where(eq(projects.id, id))
      .returning();

    if (result.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data: { ...result[0], tags } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update project error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE project
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    await db.delete(projects).where(eq(projects.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
