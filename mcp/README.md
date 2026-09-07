# Portfolio MCP server

Stdio MCP server that lets any coding agent or CLI read and edit the
portfolio database (Turso remote, or local SQLite) with validated,
parameterized queries. No raw-SQL tool — destructive mistakes are hard.

## Tools

| Tool | What it does |
|---|---|
| `portfolio_list_tables` | Readable + writable table names |
| `portfolio_describe_table` | Columns / types / PK for one table |
| `portfolio_list_projects` | Projects with optional `search`, `featuredOnly`, `limit` |
| `portfolio_get_project` | Full project row (text, image, gallery, links). Fuzzy: `"angis vision"` finds `AegisVision` |
| `portfolio_update_project` | Patch a project's text / image / gallery / links / metadata |
| `portfolio_create_project` | Create a project (slug auto-generated) |
| `portfolio_list_rows` | Generic list for any readable table |
| `portfolio_get_row` | One row by id (slug for `posts`, `project_categories`) |
| `portfolio_update_row` | Generic patch for any writable table |
| `portfolio_bust_cache` | Force-clear Upstash site caches |

Every mutation automatically busts the Upstash cache
(`v2:*`, `home:*`, `project:*`, `site:config`, `projects:all`) so the
site reflects edits immediately — the stale-certifications class of bug
can't recur through this path. Without Redis env vars the DB write still
succeeds; the result reports `cacheBusted.redis: false`.

`admin_sessions`, `sqlite_sequence` and `api_cache` are never writable.

## Setup

```bash
npm run mcp:build        # builds mcp/dist/index.js (needs repo-root .env)
```

Required env (repo-root `.env` is auto-loaded, or export them):

```bash
TURSO_DATABASE_URL="libsql://....turso.io"
TURSO_AUTH_TOKEN="..."
UPSTASH_REDIS_REST_URL="..."      # optional but recommended
UPSTASH_REDIS_REST_TOKEN="..."    # optional but recommended
```

For local dev against `local.db`, either unset `TURSO_DATABASE_URL`
or set it to `file:local.db`, and run from the repo root.

## Authentication

Every tool takes a required `auth` argument. It must exactly match the
server's `PORTFOLIO_MCP_TOKEN` (compared with a timing-safe check).
The server refuses to start without the secret set.

```bash
# generate + store (root .env is gitignored — never commit this value)
openssl rand -hex 32
# add to .env:
PORTFOLIO_MCP_TOKEN="<output>"
```

How agents get the token: keep it in your root `.env` (the server
auto-loads it) and paste it into your prompt, e.g.
"the portfolio MCP auth token is …". Do **not** put the real token in
`.mcp.json` or any committed file. Without the token every call —
reads included — returns `Unauthorized`, and wrong tokens are rejected
the same way. The token is never logged or echoed in responses.

## Connect an agent / CLI

`.mcp.json` in the repo root already registers the server:

```json
{
  "mcpServers": {
    "portfolio": { "command": "node", "args": ["mcp/dist/index.js"] }
  }
}
```

- **Claude Code / Cursor / Cline / opencode**: picks up `.mcp.json`
  automatically (rebuild first with `npm run mcp:build`).
- **Claude Desktop**: add the same entry to
  `~/Library/Application Support/Claude/claude_desktop_config.json`
  (macOS) with absolute paths, or `%APPDATA%\Claude\...` (Windows).
- **Any CLI**: `npm run mcp:start`, or test with the inspector:
  `npx @modelcontextprotocol/inspector node mcp/dist/index.js`.

## Example prompts

```text
Using the portfolio MCP server (auth token …), show me the AegisVision project.
Update the AegisVision project's description and cover image.
List the certifications table and fix the issuer names.
```

## Safety notes

- `portfolio_update_project` validates image/link fields
  (`https://…`, `http://…` or `/…`), JSON-encodes `tags`/`techStack`/
  `gallery`, and rejects duplicate slugs.
- `portfolio_update_row` rejects unknown columns and never touches the
  primary key or `created_at`.
- There is deliberately no `delete` tool — delete via the `/cat` admin UI.
