import type { APIRoute } from 'astro';
import { db, books } from '../../../db';
import { eq, asc } from 'drizzle-orm';
import { clearLoaderCaches } from '../../../lib/loaders';

export const prerender = false;

// GET all books
export const GET: APIRoute = async () => {
  try {
    const list = await db.select().from(books).orderBy(asc(books.order));
    return new Response(JSON.stringify({ success: true, data: list }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get books error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch books' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST create new book
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      title,
      author,
      type = 'read',
      category = 'Distributed Systems',
      status = 'completed',
      rating = 5,
      url,
      cover,
      takeaway,
      featured = false,
      order = 0,
    } = body;

    if (!title || !author) {
      return new Response(JSON.stringify({ success: false, error: 'Title and Author are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    const result = await db.insert(books).values({
      title,
      author,
      type,
      category,
      status,
      rating: Number(rating),
      url: url || null,
      cover: cover || null,
      takeaway: takeaway || null,
      featured: Boolean(featured),
      order: Number(order) || 0,
      createdAt: now,
      updatedAt: now,
    }).returning();

    clearLoaderCaches();

    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create book error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create book' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT update book
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Book ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    const setData: Record<string, any> = { updatedAt: now };

    const fields = [
      'title',
      'author',
      'type',
      'category',
      'status',
      'rating',
      'url',
      'cover',
      'takeaway',
      'featured',
      'order',
    ];

    for (const f of fields) {
      if (body[f] !== undefined) {
        if (f === 'rating' || f === 'order') {
          setData[f] = Number(body[f]);
        } else if (f === 'featured') {
          setData[f] = Boolean(body[f]);
        } else {
          setData[f] = body[f];
        }
      }
    }

    await db.update(books).set(setData).where(eq(books.id, id));
    clearLoaderCaches();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update book error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update book' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE book
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Book ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.delete(books).where(eq(books.id, id));
    clearLoaderCaches();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete book error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete book' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
