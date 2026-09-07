#!/usr/bin/env node
/**
 * Portfolio MCP server (stdio).
 *
 * Lets any MCP-capable coding agent / CLI read and edit the portfolio
 * database (Turso remote in production, local SQLite file for dev) with
 * validated, parameterized queries — no raw SQL tool.
 *
 * Env (read from process env, repo-root .env, or mcp/.env):
 *   PORTFOLIO_MCP_TOKEN  REQUIRED shared secret — every tool call must pass it
 *                        as `auth`. Generate: openssl rand -hex 32
 *   TURSO_DATABASE_URL   libsql://...  (or file:local.db for local dev)
 *   TURSO_AUTH_TOKEN     token for Turso (empty for local file)
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN  (optional, for cache bust)
 *
 * Run from the repo root:  node mcp/dist/index.js
 */
import { timingSafeEqual } from "node:crypto";
import { config as loadDotenv } from "dotenv";
import { createClient, type Client, type InValue } from "@libsql/client";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Redis } from "@upstash/redis";
import { z } from "zod";

// Load env from several likely locations (dotenv never overrides existing vars).
loadDotenv();
loadDotenv({ path: new URL("../../.env", import.meta.url) }); // repo root (dist or src)
loadDotenv({ path: new URL("../.env", import.meta.url) }); // mcp/.env

// ---------------------------------------------------------------------------
// Auth — shared-secret token required on EVERY tool call.
// ---------------------------------------------------------------------------

function expectedAuthToken(): string {
  return (process.env.PORTFOLIO_MCP_TOKEN || "").trim();
}

/** timing-safe compare of the caller-supplied token. Returns an error string or null. */
function authError(provided: unknown): string | null {
  const expected = expectedAuthToken();
  if (!expected) return "Server misconfigured: PORTFOLIO_MCP_TOKEN is not set.";
  const a = Buffer.from(typeof provided === "string" ? provided : "", "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return "Unauthorized: invalid MCP auth token.";
  }
  return null;
}

/** Shape fragment — spread into every tool so agents must present the secret. */
const authField = {
  auth: z.string().describe("MCP auth token — must match the server's PORTFOLIO_MCP_TOKEN"),
};

// ---------------------------------------------------------------------------
// DB + cache helpers
// ---------------------------------------------------------------------------

let db: Client | null = null;

function getDb(): Client {
  if (db) return db;
  const url = process.env.TURSO_DATABASE_URL || "file:local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  db = createClient({ url, authToken });
  return db;
}

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** Best-effort purge of the site's Upstash caches so edits show up immediately. */
async function bustSiteCache(): Promise<{ redis: boolean; deleted: string[] }> {
  const r = getRedis();
  if (!r) return { redis: false, deleted: [] };
  try {
    const found = new Set<string>();
    for (const pattern of ["v2:*", "home:*", "project:*"]) {
      const keys = await r.keys(pattern);
      for (const k of keys) found.add(k);
    }
    found.add("site:config");
    found.add("projects:all");
    const all = [...found];
    if (all.length > 0) await r.del(...all);
    return { redis: true, deleted: all };
  } catch {
    return { redis: false, deleted: [] };
  }
}

// ---------------------------------------------------------------------------
// Result helpers
// ---------------------------------------------------------------------------

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function jsonResult(data: unknown) {
  return textResult(JSON.stringify(data, null, 2));
}

function err(message: string, hint?: string) {
  return textResult(`ERROR: ${message}${hint ? `\nHint: ${hint}` : ""}`);
}

/** Narrow an unknown JS value to a libsql bind value. */
function toArg(v: unknown): InValue {
  if (v === undefined) return null;
  if (
    v === null ||
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "bigint" ||
    typeof v === "boolean" ||
    v instanceof Uint8Array
  )
    return v;
  return String(v);
}

// ---------------------------------------------------------------------------
// Table allowlists + validation
// ---------------------------------------------------------------------------

const TABLE_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Tables readable through the MCP server (everything except auth/internals). */
const READ_TABLES = new Set([
  "projects",
  "experiences",
  "education",
  "publications",
  "skills",
  "certifications",
  "achievements",
  "interests",
  "languages",
  "testimonials",
  "hero_metrics",
  "uses",
  "project_categories",
  "books",
  "gallery_photos",
  "workshop_projects",
  "bio_content",
  "site_settings",
  "social_links",
  "navigation_items",
  "faqs",
  "posts",
  "support_options",
  "developer_metrics",
  "page_views",
  "clicks",
]);

/** Tables writable through the MCP server. Auth/cache internals are excluded. */
const WRITE_TABLES = new Set([
  "projects",
  "experiences",
  "education",
  "publications",
  "skills",
  "certifications",
  "achievements",
  "interests",
  "languages",
  "testimonials",
  "hero_metrics",
  "uses",
  "project_categories",
  "books",
  "gallery_photos",
  "workshop_projects",
  "bio_content",
  "site_settings",
  "social_links",
  "navigation_items",
  "faqs",
  "posts",
  "support_options",
]);

/** Tables whose primary key is `slug` instead of integer `id`. */
const SLUG_PK_TABLES = new Set(["posts", "project_categories"]);

function assertTable(table: string, forWrite: boolean): string | null {
  if (!TABLE_RE.test(table)) return `Invalid table name "${table}".`;
  if (forWrite && !WRITE_TABLES.has(table)) {
    return `Table "${table}" is not writable via MCP. Writable: ${[...WRITE_TABLES].join(", ")}.`;
  }
  if (!forWrite && !READ_TABLES.has(table)) {
    return `Table "${table}" is not readable via MCP.`;
  }
  return null;
}

interface ColumnInfo {
  name: string;
  type: string;
  pk: boolean;
}

async function getColumns(table: string): Promise<ColumnInfo[]> {
  const r = await getDb().execute({ sql: `PRAGMA table_info("${table}")`, args: [] });
  return r.rows.map((row: unknown) => {
    const c = row as Record<string, unknown>;
    return { name: String(c.name), type: String(c.type ?? ""), pk: Number(c.pk) > 0 };
  });
}

// ---------------------------------------------------------------------------
// Project helpers (the most-edited content: text, image, links, ...)
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v !== "string") return [];
  const s = v.trim();
  if (!s) return [];
  try {
    const parsed: unknown = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* not JSON — fall through to delimiter split */
  }
  return s
    .split(/,|\||\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function safeJsonParse(v: unknown, fallback: unknown): unknown {
  if (v === null || v === undefined) return fallback;
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

/** Present a project row with JSON text columns parsed for the agent. */
function formatProject(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    featured: Boolean(row.featured),
    tags: safeJsonParse(row.tags, []),
    tech_stack: safeJsonParse(row.tech_stack, []),
    gallery: safeJsonParse(row.gallery, []),
    metrics: safeJsonParse(row.metrics, {}),
  };
}

interface ResolvedProject {
  row: Record<string, unknown>;
  matchedBy: string;
  candidates?: Array<Record<string, unknown>>;
}

/** Resolve a project by id, slug, exact name, or fuzzy tokens ("angis vision" -> AegisVision). */
async function resolveProject(identifier: string): Promise<ResolvedProject> {
  const dbc = getDb();
  const idNum = Number(identifier);
  if (Number.isInteger(idNum) && idNum > 0) {
    const r = await dbc.execute({ sql: `SELECT * FROM projects WHERE id = ? LIMIT 1`, args: [idNum] });
    if (r.rows.length > 0) return { row: r.rows[0] as Record<string, unknown>, matchedBy: "id" };
  }

  const slugNorm = slugify(identifier);
  for (const [sql, args, by] of [
    [`SELECT * FROM projects WHERE slug = ? LIMIT 1`, [identifier], "slug"],
    [`SELECT * FROM projects WHERE slug = ? LIMIT 1`, [slugNorm], "slug(normalized)"],
    [`SELECT * FROM projects WHERE lower(name) = lower(?) LIMIT 1`, [identifier], "name(exact)"],
  ] as Array<[string, InValue[], string]>) {
    const r = await dbc.execute({ sql, args });
    if (r.rows.length > 0) return { row: r.rows[0] as Record<string, unknown>, matchedBy: by };
  }

  // Substring search on name/slug.
  let r = await dbc.execute({
    sql: `SELECT * FROM projects WHERE lower(name) LIKE '%' || lower(?) || '%' OR slug LIKE '%' || lower(?) || '%' LIMIT 5`,
    args: [identifier, slugNorm],
  });
  if (r.rows.length === 1) return { row: r.rows[0] as Record<string, unknown>, matchedBy: "name/slug(substring)" };
  if (r.rows.length > 1) {
    return {
      row: r.rows[0] as Record<string, unknown>,
      matchedBy: "ambiguous",
      candidates: r.rows.map((x) => {
        const p = x as Record<string, unknown>;
        return { id: p.id, name: p.name, slug: p.slug };
      }),
    };
  }

  // Token fallback: any significant word matching (handles typos like "angis vision").
  const tokens = identifier
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
  const seen = new Map<unknown, Record<string, unknown>>();
  for (const t of tokens) {
    const tr = await dbc.execute({
      sql: `SELECT * FROM projects WHERE lower(name) LIKE '%' || ? || '%' OR slug LIKE '%' || ? || '%' LIMIT 5`,
      args: [t, t],
    });
    for (const x of tr.rows) {
      const p = x as Record<string, unknown>;
      if (!seen.has(p.id)) seen.set(p.id, p);
    }
  }
  const found = [...seen.values()];
  if (found.length === 1) return { row: found[0], matchedBy: "token(fuzzy)" };
  if (found.length > 1) {
    return {
      row: found[0],
      matchedBy: "ambiguous",
      candidates: found.map((p) => ({ id: p.id, name: p.name, slug: p.slug })),
    };
  }

  const all = await dbc.execute(`SELECT id, name, slug FROM projects ORDER BY id LIMIT 50`);
  throw new Error(
    `No project matches "${identifier}". Existing: ` +
      (all.rows as Record<string, unknown>[]).map((p) => `${p.name} (${p.slug})`).join(", ")
  );
}

const URL_RE = /^(https?:\/\/|\/)/;

/** camelCase tool arg -> snake_case column for projects. */
const PROJECT_COLUMNS: Record<string, string> = {
  name: "name",
  slug: "slug",
  description: "description",
  content: "content",
  url: "url",
  github: "github",
  image: "image",
  tags: "tags",
  category: "category",
  featured: "featured",
  status: "status",
  projectDate: "project_date",
  stars: "stars",
  order: "order",
  techStack: "tech_stack",
  demoUrl: "demo_url",
  documentation: "documentation",
  metrics: "metrics",
  gallery: "gallery",
  teamSize: "team_size",
  duration: "duration",
  role: "role",
  challenges: "challenges",
  outcomes: "outcomes",
  lessonsLearned: "lessons_learned",
};

const JSON_ARRAY_FIELDS = new Set(["tags", "techStack", "gallery"]);
const URL_FIELDS = new Set(["url", "github", "image", "demoUrl", "documentation"]);

/** Convert validated tool args into {column: value} for the UPDATE/INSERT. */
function projectArgsToColumns(args: Record<string, unknown>): Record<string, unknown> {
  const cols: Record<string, unknown> = {};
  for (const [arg, col] of Object.entries(PROJECT_COLUMNS)) {
    const v = args[arg];
    if (v === undefined) continue;
    if (v === null) {
      cols[col] = null;
      continue;
    }
    if (JSON_ARRAY_FIELDS.has(arg)) {
      cols[col] = JSON.stringify(parseStringArray(v));
    } else if (arg === "metrics") {
      cols[col] = typeof v === "string" ? v : JSON.stringify(v);
    } else if (arg === "featured") {
      cols[col] = v ? 1 : 0;
    } else if (arg === "stars" || arg === "order" || arg === "teamSize") {
      const n = Number(v);
      if (!Number.isInteger(n)) throw new Error(`"${arg}" must be an integer, got: ${String(v)}`);
      cols[col] = n;
    } else if (arg === "slug" && typeof v === "string") {
      cols[col] = slugify(v);
    } else if (URL_FIELDS.has(arg) && typeof v === "string" && v.length > 0 && !URL_RE.test(v)) {
      throw new Error(`"${arg}" must start with https://, http:// or /. Got: ${v}`);
    } else {
      cols[col] = v;
    }
  }
  return cols;
}

// ---------------------------------------------------------------------------
// MCP server + tools
// ---------------------------------------------------------------------------

const server = new McpServer({ name: "portfolio", version: "1.0.0" });

server.tool("portfolio_list_tables", "List database tables available via MCP, split into readable and writable. Requires `auth`.", { ...authField }, async ({ auth }) => {
  const bad = authError(auth);
  if (bad) return err(bad);
  return jsonResult({ readable: [...READ_TABLES].sort(), writable: [...WRITE_TABLES].sort() });
});

server.tool(
  "portfolio_describe_table",
  "Show column names, types and primary key for a portfolio table.",
  { ...authField, table: z.string().describe("Table name, e.g. projects") },
  async ({ auth, table }) => {
    const unauth = authError(auth);
    if (unauth) return err(unauth);
    const bad = assertTable(table, false);
    if (bad) return err(bad);
    try {
      const cols = await getColumns(table);
      if (cols.length === 0) return err(`Table "${table}" does not exist.`);
      return jsonResult({ table, writable: WRITE_TABLES.has(table), columns: cols });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  }
);

server.tool(
  "portfolio_list_projects",
  "List portfolio projects (id, name, slug, status, image). Use search to filter by name/slug.",
  {
    ...authField,
    search: z.string().optional().describe("Substring to match against name or slug"),
    featuredOnly: z.boolean().optional().describe("Only featured projects"),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows (default 30)"),
  },
  async ({ auth, search, featuredOnly, limit }) => {
    const unauth = authError(auth);
    if (unauth) return err(unauth);
    try {
      const lim = Math.min(Math.max(limit ?? 30, 1), 100);
      const where: string[] = [];
      const args: InValue[] = [];
      if (search) {
        where.push(`(lower(name) LIKE '%' || lower(?) || '%' OR slug LIKE '%' || lower(?) || '%')`);
        args.push(search, slugify(search));
      }
      if (featuredOnly) where.push(`featured = 1`);
      const sql = `SELECT id, name, slug, description, url, github, image, category, featured, status, stars, "order" FROM projects${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY "order", id LIMIT ?`;
      const r = await getDb().execute({ sql, args: [...args, lim] });
      return jsonResult({ count: r.rows.length, projects: r.rows });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  }
);

server.tool(
  "portfolio_get_project",
  "Get one project with ALL fields (full text, image, gallery, tech stack, links). Identifier can be id, slug, exact name, or fuzzy words — e.g. 'angis vision' finds AegisVision.",
  { ...authField, identifier: z.string().describe("Project id, slug, name, or keywords") },
  async ({ auth, identifier }) => {
    const unauth = authError(auth);
    if (unauth) return err(unauth);
    try {
      const found = await resolveProject(identifier);
      if (found.matchedBy === "ambiguous") {
        return jsonResult({
          warning: "Multiple projects matched — refine the identifier.",
          candidates: found.candidates,
          first: formatProject(found.row),
        });
      }
      return jsonResult({ matchedBy: found.matchedBy, project: formatProject(found.row) });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  }
);

const projectCommonFields = {
  slug: z.string().optional(),
  content: z.string().optional().describe("Full markdown body of the project page"),
  github: z.string().optional(),
  image: z.string().optional().describe("Cover image URL (https://... or /...)"),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  category: z.string().optional(),
  featured: z.boolean().optional(),
  status: z.string().optional(),
  projectDate: z.string().optional(),
  stars: z.number().int().optional(),
  order: z.number().int().optional(),
  techStack: z.union([z.array(z.string()), z.string()]).optional(),
  demoUrl: z.string().optional(),
  documentation: z.string().optional(),
  metrics: z.union([z.record(z.any()), z.string()]).optional(),
  gallery: z.union([z.array(z.string()), z.string()]).optional(),
  teamSize: z.number().int().nullable().optional(),
  duration: z.string().optional(),
  role: z.string().optional(),
  challenges: z.string().optional().describe("Markdown"),
  outcomes: z.string().optional().describe("Markdown"),
  lessonsLearned: z.string().optional().describe("Markdown"),
};

/** Optional patch fields for portfolio_update_project (identifier is separate). */
const projectPatchShape = {
  name: z.string().optional(),
  description: z.string().optional().describe("Short summary shown on cards"),
  url: z.string().optional(),
  ...projectCommonFields,
};

server.tool(
  "portfolio_update_project",
  "Update a portfolio project's text, image, gallery, links, or metadata. Prefer portfolio_get_project first to see current values. Site caches are busted automatically.",
  {
    identifier: z.string().describe("Project id, slug, name, or keywords (e.g. 'aegisvision', 'AegisVision')"),
    ...authField,
    ...projectPatchShape,
  },
  async (args) => {
    try {
      const { identifier, auth, ...patch } = args as Record<string, unknown> & { identifier: string; auth: unknown };
      const unauth = authError(auth);
      if (unauth) return err(unauth);
      const cols = projectArgsToColumns(patch);
      if (Object.keys(cols).length === 0) return err("No fields to update — pass at least one field besides identifier.");
      const found = await resolveProject(String(identifier));
      if (found.matchedBy === "ambiguous") {
        return jsonResult({ error: "Ambiguous identifier.", candidates: found.candidates });
      }
      const row = found.row;
      if (cols.slug && cols.slug !== row.slug) {
        const dup = await getDb().execute({ sql: `SELECT id FROM projects WHERE slug = ? LIMIT 1`, args: [toArg(cols.slug)] });
        if (dup.rows.length > 0) return err(`Slug "${cols.slug}" is already taken by another project.`);
      }
      const now = new Date().toISOString();
      const sets = [...Object.keys(cols).map((c) => `"${c}" = ?`), `"updated_at" = ?`];
      const values: InValue[] = [...Object.values(cols).map(toArg), now];
      await getDb().execute({ sql: `UPDATE projects SET ${sets.join(", ")} WHERE id = ?`, args: [...values, toArg(row.id)] });
      const fresh = await getDb().execute({ sql: `SELECT * FROM projects WHERE id = ? LIMIT 1`, args: [toArg(row.id)] });
      const cache = await bustSiteCache();
      return jsonResult({ updated: formatProject(fresh.rows[0] as Record<string, unknown>), cacheBusted: cache });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  }
);

server.tool(
  "portfolio_create_project",
  "Create a new portfolio project. Slug is auto-generated from the name when omitted.",
  {
    name: z.string().describe("Project name"),
    description: z.string().describe("Short summary"),
    url: z.string().describe("Main URL (https://... or /...)"),
    ...authField,
    ...projectCommonFields,
  },
  async (args) => {
    try {
      const { name, description, url, auth, ...rest } = args as Record<string, unknown> & {
        name: string;
        description: string;
        url: string;
        auth: unknown;
      };
      const unauth = authError(auth);
      if (unauth) return err(unauth);
      if (!name?.trim() || !description?.trim() || !url?.trim()) return err("name, description and url are required.");
      if (!URL_RE.test(url)) return err(`"url" must start with https://, http:// or /. Got: ${url}`);
      const cols = projectArgsToColumns({ name, description, url, slug: (rest.slug as string) || slugify(name), ...rest });
      const dup = await getDb().execute({ sql: `SELECT id FROM projects WHERE slug = ? LIMIT 1`, args: [toArg(cols.slug)] });
      if (dup.rows.length > 0) return err(`Slug "${cols.slug}" already exists — pass an explicit unique slug.`);
      const now = new Date().toISOString();
      const names = [...Object.keys(cols), "created_at", "updated_at"];
      const placeholders = names.map(() => "?").join(", ");
      const res = await getDb().execute({
        sql: `INSERT INTO projects (${names.map((n) => `"${n}"`).join(", ")}) VALUES (${placeholders})`,
        args: [...Object.values(cols).map(toArg), now, now],
      });
      const id = Number(res.lastInsertRowid);
      const fresh = await getDb().execute({ sql: `SELECT * FROM projects WHERE id = ? LIMIT 1`, args: [id] });
      const cache = await bustSiteCache();
      return jsonResult({ created: formatProject(fresh.rows[0] as Record<string, unknown>), cacheBusted: cache });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  }
);

server.tool(
  "portfolio_list_rows",
  "List rows from any readable table (experiences, skills, certifications, ...).",
  {
    ...authField,
    table: z.string().describe("Table name — see portfolio_list_tables"),
    search: z.string().optional().describe("Substring filter"),
    searchColumn: z.string().optional().describe("Column to search (default auto-detects name/title/question/label)"),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows (default 30)"),
  },
  async ({ auth, table, search, searchColumn, limit }) => {
    const unauth = authError(auth);
    if (unauth) return err(unauth);
    const bad = assertTable(table, false);
    if (bad) return err(bad);
    try {
      const lim = Math.min(Math.max(limit ?? 30, 1), 100);
      const cols = await getColumns(table);
      if (cols.length === 0) return err(`Table "${table}" does not exist.`);
      const names = new Set(cols.map((c) => c.name));
      let sql = `SELECT * FROM "${table}"`;
      const args: InValue[] = [];
      if (search) {
        let col = searchColumn;
        if (!col) col = ["name", "title", "question", "label", "key", "company", "institution"].find((c) => names.has(c));
        if (!col) return err(`Table "${table}" has no default searchable text column — pass searchColumn explicitly.`);
        if (!names.has(col)) return err(`Column "${col}" does not exist on "${table}".`);
        sql += ` WHERE lower("${col}") LIKE '%' || lower(?) || '%'`;
        args.push(search);
      }
      sql += ` ORDER BY rowid LIMIT ?`;
      const r = await getDb().execute({ sql, args: [...args, lim] });
      return jsonResult({ table, count: r.rows.length, rows: r.rows });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  }
);

server.tool(
  "portfolio_get_row",
  "Get a single row by id (or slug for posts / project_categories).",
  {
    ...authField,
    table: z.string(),
    id: z.string().describe("Numeric id, or slug for posts / project_categories"),
  },
  async ({ auth, table, id }) => {
    const unauth = authError(auth);
    if (unauth) return err(unauth);
    const bad = assertTable(table, false);
    if (bad) return err(bad);
    try {
      const cols = await getColumns(table);
      if (cols.length === 0) return err(`Table "${table}" does not exist.`);
      let r;
      if (SLUG_PK_TABLES.has(table)) {
        r = await getDb().execute({ sql: `SELECT * FROM "${table}" WHERE slug = ? LIMIT 1`, args: [id] });
      } else {
        const n = Number(id);
        if (!Number.isInteger(n)) return err(`"${table}" uses a numeric id — got "${id}".`);
        r = await getDb().execute({ sql: `SELECT * FROM "${table}" WHERE id = ? LIMIT 1`, args: [n] });
      }
      if (r.rows.length === 0) return err(`No row in "${table}" for "${id}".`);
      return jsonResult(r.rows[0]);
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  }
);

server.tool(
  "portfolio_update_row",
  "Update a row in any writable table (except its primary key). Objects/arrays are stored as JSON strings. Site caches are busted automatically.",
  {
    ...authField,
    table: z.string().describe("Table name — see portfolio_list_tables"),
    id: z.string().describe("Numeric id, or slug for posts/project_categories"),
    patch: z.record(z.any()).describe("Column -> new value mapping"),
  },
  async ({ auth, table, id, patch }) => {
    const unauth = authError(auth);
    if (unauth) return err(unauth);
    const bad = assertTable(table, true);
    if (bad) return err(bad);
    try {
      const cols = await getColumns(table);
      if (cols.length === 0) return err(`Table "${table}" does not exist.`);
      const byName = new Map(cols.map((c) => [c.name, c]));
      const pk = SLUG_PK_TABLES.has(table) ? "slug" : "id";
      const sets: string[] = [];
      const values: InValue[] = [];
      for (const [k, v] of Object.entries(patch)) {
        if (k === pk || k === "created_at") continue;
        const col = byName.get(k);
        if (!col) return err(`Unknown column "${k}" on "${table}". Use portfolio_describe_table first.`);
        if (v !== null && typeof v === "object") {
          sets.push(`"${k}" = ?`);
          values.push(JSON.stringify(v));
        } else {
          sets.push(`"${k}" = ?`);
          values.push(toArg(v));
        }
      }
      if (sets.length === 0) return err("Nothing to update after filtering primary key / unknown columns.");
      if (byName.has("updated_at")) {
        const t = byName.get("updated_at")!.type.toUpperCase();
        sets.push(`"updated_at" = ?`);
        values.push(t.includes("INT") ? Date.now() : new Date().toISOString());
      }
      const where = SLUG_PK_TABLES.has(table) ? `"slug" = ?` : `"id" = ?`;
      const whereVal = SLUG_PK_TABLES.has(table) ? id : Number(id);
      if (!SLUG_PK_TABLES.has(table) && !Number.isInteger(whereVal)) return err(`"${table}" uses a numeric id — got "${id}".`);
      const res = await getDb().execute({ sql: `UPDATE "${table}" SET ${sets.join(", ")} WHERE ${where}`, args: [...values, whereVal] });
      if (Number(res.rowsAffected) === 0) return err(`No row in "${table}" for "${id}".`);
      const fresh = await getDb().execute({ sql: `SELECT * FROM "${table}" WHERE ${where} LIMIT 1`, args: [whereVal] });
      const cache = await bustSiteCache();
      return jsonResult({ updated: fresh.rows[0], cacheBusted: cache });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  }
);

server.tool("portfolio_bust_cache", "Force-clear the site's Upstash Redis caches (v2:*, home:*, project:*, site:config) so recent DB edits show up immediately. Requires `auth`.", { ...authField }, async ({ auth }) => {
  const unauth = authError(auth);
  if (unauth) return err(unauth);
  const cache = await bustSiteCache();
  return jsonResult(cache.redis ? { ok: true, ...cache } : { ok: false, reason: "UPSTASH_REDIS_REST_URL/TOKEN not configured — in-process caches only." });
});

// ---------------------------------------------------------------------------

async function main() {
  if (!expectedAuthToken()) {
    console.error("[portfolio-mcp] fatal: PORTFOLIO_MCP_TOKEN is not set.");
    console.error("[portfolio-mcp] Generate one with `openssl rand -hex 32` and add it to your root .env (and pass it as `auth` on every tool call).");
    process.exit(1);
  }
  await server.connect(new StdioServerTransport());
  console.error("[portfolio-mcp] ready (stdio)");
}

main().catch((e) => {
  console.error("[portfolio-mcp] fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
