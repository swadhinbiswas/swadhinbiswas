// Adds four flagship case studies to the portfolio and curates the home order.
// Content is grounded in each project's own README (TerraSentinel, JustAPI,
// contexa, Eco-Guard). Idempotent: upserts by slug.
// Usage: node scripts/seed-new-projects.mjs
import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("TURSO_DATABASE_URL not set — aborting.");
  process.exit(1);
}
const client = createClient({ url, authToken });
const log = (...a) => console.log(...a);

const items = [
  {
    name: "TerraSentinel",
    slug: "terrasentinel",
    description:
      "A $0 anomaly-detection platform over free satellite and sensor data. Four public sources flow into a versioned Hugging Face lake, dbt and DuckDB build seven gold marts, an IsolationForest scores anomalies, and an edge dashboard serves it from Turso.",
    content: `TerraSentinel watches the planet's slow disasters — wildfires, vanishing sea ice, deforestation and glacier change — using only free public data and free compute. GitHub Actions runs the jobs, Hugging Face Hub stores the lake and the model registry, Turso serves the gold tables, and a Cloudflare Pages dashboard reads them at the edge.

## What it is

Four public sources feed the pipeline: NASA FIRMS active-fire detections, Copernicus Sentinel-1 and Sentinel-2 imagery processed in Google Earth Engine, NOAA OISST v2.1 sea-surface temperature plus the NSIDC Sea Ice Index, and ENTSO-E day-ahead prices and load. Collectors land raw data into a versioned bronze lake on Hugging Face. dbt on DuckDB builds staging, intermediate and seven gold marts. An IsolationForest scores the latest features, and batch scoring writes predictions back into the serving database.

## The transform layer

Bronze parquet is read straight from the Hugging Face Hub. Staging deduplicates fire detections and unifies MODIS and VIIRS brightness, builds region series and a resolution-5 grid for Sentinel, and computes sea-ice and SST anomalies against the NSIDC 1981-2010 climatology. Intermediate models build a dense region-by-day spine, H3 cells for the map, a circular plus-or-minus-15-day fire baseline, and monthly Sentinel change. Gold ships one mart per source arm, so an outage in one source can only remove its own table.

## Anomaly definitions

Every mart states its baseline, because the anomaly is the whole product: daily fire counts against a median over the same plus-or-minus-15 days scaled by MAD, monthly NDVI against the same month a year earlier, sea-ice extent against the published NSIDC normal, and SAR backscatter year-over-year. Fires use median and MAD rather than mean and standard deviation, because a large fire sits inside its own baseline window and would inflate the yardstick it is measured against.

## The ML layer

An IsolationForest is trained on 27 strictly causal features, meaning every rolling window ends before the day being scored. The score is a percentile against the training distribution, so it reads the same at serving time as in training. MLflow logs the exact dataset commit behind each run, and the model is published to a Hugging Face model repo.

## The dashboard

Eight pages run on Cloudflare's edge: Overview, Analysis, Stories, Catalog, Explorer, SQL and Ops. The charts are hand-rolled SVG rather than a charting library, so the first paint contains the chart and a JavaScript failure cannot blank a panel. The map uses real H3 cells, and severity uses a luminance ramp rather than red-green. Every API route is read-only and precomputed; no inference runs on the request path.

## The Databricks hybrid path

Alongside the free-tier pipeline, the same lake is mirrored as a Databricks Asset Bundle: six Workflows jobs on Quartz crons, declarative Spark and Delta Lake pipelines, Unity Catalog DDL and MLflow registration. It ships paused by design, so handing over from GitHub Actions to Databricks is a one-line, side-effect-free flip. The Unity Catalog DDL and MERGE statements are generated from a single source of truth and checked in CI, so the schema cannot drift.

## Proving it works

An unsupervised model can always claim to work, so the pipeline ships a falsifiable check. A synthetic lake plants one obvious event per anomaly type, the full dbt build runs against it, and CI asserts each event is flagged while the overall flag rate stays under 2%, which rejects a degenerate baseline that flags everything.`,
    url: "https://terrasentinel-dashboard.pages.dev",
    github: "https://github.com/swadhinbiswas/TerraSentinel",
    image: null,
    tags: JSON.stringify([
      "data-engineering",
      "databricks",
      "lakehouse",
      "dbt",
      "duckdb",
      "anomaly-detection",
      "satellite",
      "mlflow",
      "serverless",
      "python",
    ]),
    category: "data-engineering",
    featured: 1,
    status: "Active",
    project_date: null,
    stars: 1,
    order: 2,
    tech_stack: JSON.stringify([
      "Python",
      "Databricks",
      "Apache Spark",
      "Delta Lake",
      "Unity Catalog",
      "dbt",
      "DuckDB",
      "MLflow",
      "scikit-learn",
      "Hugging Face",
      "Turso",
      "Astro",
      "Cloudflare Pages",
      "GitHub Actions",
      "Pandera",
    ]),
    demo_url: "https://terrasentinel-dashboard.pages.dev",
    documentation: null,
    metrics: JSON.stringify({
      "gold marts": "7",
      "dbt nodes": "117",
      "unit tests": "592",
      "rows served": "76,607",
      "public sources": "4",
      "model features": "27",
      model: "IsolationForest",
      cost: "$0",
      license: "MIT",
      repository_status: "Active",
    }),
    gallery: "[]",
    team_size: 1,
    duration: null,
    role: "Creator & maintainer",
    challenges: `- **DuckDB over the Hub re-lists the repo tree on every query.** With staging as views, about 50 dbt tests meant 50-plus tree listings against a 1,000-per-5-minute API quota. Mirroring the bronze lake locally first turns a full 117-node build into zero API calls and about four seconds.
- **Choosing FIRMS products by "is this a backfill?" returns empty data for the most recent quarter.** Standard processing lags real time by about three months and near-real-time is retained for about three months, so the product is chosen by window age with a fallback through the overlap.
- **Sentinel at per-pixel H3 is unaffordable.** Bucketing at resolution 7 means 203,485 cells for Iberia and 677,760 for Norway, which no free Earth Engine quota absorbs. A region-grain series plus a resolution-5 change map answers the same questions at a cost that runs.
- **An unsupervised model can always claim to work.** The fix is a falsifiable test: synthetic anomalies injected into a synthetic lake, a real dbt build, and an assertion that they are flagged without the flag rate blowing up.
- **A chart island that fails to hydrate renders nothing.** A charting library failed three separate ways, so the charts became server-rendered SVG where a JavaScript failure cannot blank the panel.`,
    outcomes: `- Seven gold marts and 117 dbt nodes, all tests green, on a fully offline CI build.
- 592 unit tests plus a full dbt build and a type-checked dashboard build.
- 76,607 rows synced into Turso: four gold marts plus 1,462 model predictions, read at sub-10 ms from Cloudflare's edge.
- An IsolationForest published to a Hugging Face model repo, traced to a bronze commit hash.
- A live dashboard with eight pages and seven read-only API routes.
- A Databricks Asset Bundle that mirrors the lake with six Workflows jobs and Unity Catalog DDL, tested and paused by default.
- Total infrastructure cost: $0.`,
    lessons_learned: `- **Median and MAD, not mean and standard deviation.** Measured on the same fire event: a z-score of 7.2 with mean and standard deviation versus 16.9 with median and MAD, because the event inflates the yardstick it is measured against.
- **Pick the grain before the tool.** The right bucket size differs by an order of magnitude between a 375 m fire detection and a 0.25-degree ocean grid.
- **Probe the archives instead of trusting the docs.** A documented endpoint redirected to a host that timed out, a temperature copy turned out to be a stale 2002-2011 slice, and the ice index had moved from v3.0 to v4.0.
- **Store the lake as dataset repositories, not buckets.** Dataset repos are git-backed, which is what makes it possible for MLflow to log the exact commit behind a model.
- **Never let an unsupervised result go unmeasured.** Compare against an independent rule and report the overlap, including when the model adds no information.`,
  },
  {
    name: "JustAPI",
    slug: "justapi",
    description:
      "A Python web framework with a Rust core: Python runs your handlers while Rust owns networking, TLS, routing, validation and serialization. 766k req/s hello-world, a p99 of 0.48 ms, and a 12 MB footprint.",
    content: `JustAPI is a Python web framework where the framework itself is Rust. You write Python handlers; Rust owns the socket, TLS, HTTP/1.1, HTTP/2 and HTTP/3, routing, middleware, validation and JSON serialization. It installs with a single pip install, needs no uvicorn or gunicorn, and starts in milliseconds.

The constraint that shaped the project was written down early: if a feature can be implemented in Rust, it must be. Python is reserved for the code that is different for every application.

## A request's path

Kernel epoll or io_uring into a tokio connection manager, TLS through rustls, HTTP parsing through hyper, routing through a matchit radix trie, then the middleware chain, then a zero-copy PyO3 boundary into your handler, then Rust serialization back to the socket. Routes marked native with a schema skip Python entirely: Rust validates the body and writes the response.

## Performance, with the caveats

Hello-world at 100 concurrent connections over 30 seconds reaches 766k req/s, and 782k req/s on JSON echo, with a p99 of 0.48 ms and 12 MB resident memory — against 314k for Granian, 39k for Robyn and 36k for FastAPI with Uvicorn. Route lookup averages 51 ns on a 500-route table. Rust-native CRUD reaches 181k SELECT requests per second, about 125 times the same database fixture under FastAPI, and native async database awaits run on the database's tokio runtime with the GIL released.

Those numbers apply to the native fast path, which requires a schema. Handlers without one fall back to the Python dispatch path at roughly 60k req/s, and on GIL-locked CPython that path is capped around 100-120k req/s regardless of framework — that is the GIL rather than the framework. Free-threaded CPython 3.14t removes the ceiling and runs CPU-bound handlers about 12.4 times faster.

## Native operations

Async database queries await on the database's own runtime, so the event loop never blocks. Server-sent events are generated in Rust with zero Python per event. There is a Rust-native CRUD path, adaptive batching for bursty workloads, and a multi-worker prefork mode with load-based auto-scaling.

## Security and protocols

JWT authentication with per-route roles and scopes, GCRA rate limiting with a Redis backend, configurable CORS, JSON Schema validation compiled in Rust with a Pydantic v2 bridge, and security headers. On top of REST with OpenAPI 3.1 there is WebSocket, server-sent events, gRPC through Tonic, and GraphQL through async-graphql.

## Migrating from FastAPI

The decorator API and Pydantic integration mirror FastAPI, so most applications migrate by changing the import and the app class, and the built-in transport removes the separate server process.

## Quality gates

Every pull request is gated on tests, clippy with warnings denied, rustfmt, memory-safety sanitizers when the core is touched, an appended benchmark entry when performance is touched, and a recorded architecture decision when the design changes. The project carries an append-only benchmark ledger, an ADR log, and a 141-page documentation site.`,
    url: "",
    github: "https://github.com/swadhinbiswas/JustAPI",
    image: null,
    tags: JSON.stringify([
      "rust",
      "python",
      "web-framework",
      "http2",
      "http3",
      "async",
      "performance",
      "pypi",
      "open-source",
    ]),
    category: "web",
    featured: 1,
    status: "Active",
    project_date: null,
    stars: 6,
    order: 5,
    tech_stack: JSON.stringify([
      "Rust",
      "Python",
      "PyO3",
      "tokio",
      "hyper",
      "rustls",
      "serde",
      "maturin",
      "OpenTelemetry",
      "Prometheus",
      "Docker",
      "Kubernetes",
      "PyPI",
    ]),
    demo_url: null,
    documentation: null,
    metrics: JSON.stringify({
      "hello-world": "766k req/s",
      "json echo": "782k req/s",
      "p99 hello-world": "0.48 ms",
      "route lookup": "51 ns / 500 routes",
      "native crud": "181k req/s",
      "resident memory": "12 MB",
      license: "MIT",
      repository_status: "Active",
    }),
    gallery: "[]",
    team_size: 1,
    duration: null,
    role: "Creator & maintainer",
    challenges: `- **The GIL caps the Python path.** On GIL-locked CPython the Python dispatch path tops out around 100-120k req/s no matter the framework. Three experiments proved no coroutine driver, bridge or multi-loop design beats asyncio's own stepping, so the win has to come from moving work into Rust or from free-threaded Python.
- **The fast path needs a schema.** Routes without a schema fall back to the Python handler path, so the headline numbers only apply where validation is declared, and that has to be stated plainly.
- **Light async handlers are loop-bound.** Handlers that only sleep or echo are capped by the asyncio loop, which is why the native operations (database, SSE, CRUD) matter more than micro-benchmarks.
- **Memory safety in a Rust core.** The suite runs AddressSanitizer, Miri on all unsafe code and six fuzz targets, and cargo-deny audits the dependency supply chain.`,
    outcomes: `- Published on PyPI, with wheels for CPython 3.11 through 3.14 including the free-threaded 3.14t build.
- 766k req/s hello-world and a 0.48 ms p99 on the documented benchmark hardware, with the methodology published.
- A 141-page documentation site, a FastAPI migration guide, an append-only benchmark ledger, and an ADR log from ADR-001 to ADR-093.
- HTTP/3 over QUIC, which no other Python framework ships.
- A CLI that scaffolds a full CRUD project across seven database backends and four API styles.`,
    lessons_learned: `- **State the caveats next to the numbers.** The non-native path, the GIL ceiling and the loop-bound async cases are documented on the same page as the headline results, because a benchmark without its limits is marketing.
- **Move the work, do not chase the loop.** Three dead ends proved the coroutine dispatch was already optimal, which redirected the effort to native operations and free-threaded Python.
- **Gate quality in CI, not in review.** Sanitizers, fuzzing, cargo-deny and the ADR requirement each catch a class of problem before it reaches main.
- **Do not ship unverified claims.** The inference phases are excluded from this release because there was no real GPU run to stand behind.`,
  },
  {
    name: "contexa",
    slug: "contexa",
    description:
      "Versioned memory for LLM agents, built on Git's branching model: observation-thought-action logs, commits, branches and merges for an agent's context, implemented in seven languages that share one .GCC/ on-disk format.",
    content: `contexa implements the Git Context Controller, a structured memory system for LLM-based agents described in arXiv:2508.00031. It gives an agent a memory that survives across sessions, branches for parallel exploration, and compressed recall at any resolution. The name is a play on context and cortex.

The problem it addresses is that agents lose earlier reasoning as the context window fills. Dumping the full history, naive summarization and ad-hoc memory stores are expensive, lossy or unstructured. GCC applies Git's branching model instead.

## The Git model for memory

- OTA Log is the working directory: a continuous observation, thought and action trace.
- COMMIT is a git commit: a milestone summary that compresses older OTA steps.
- BRANCH is a git branch: an isolated workspace for an alternative reasoning path.
- MERGE integrates a successful branch back into the main trajectory.
- CONTEXT is a git log: history retrieved at K-commit resolution.

## The memory hierarchy

A workspace holds three tiers under a .GCC/ directory: a global roadmap in main.md, commit-level milestone summaries per branch, and fine-grained OTA traces beneath them, all as human-readable Markdown and YAML with branch metadata alongside. Because the storage is plain text, agent memory can be inspected and debugged in an editor.

## Seven implementations, one format

contexa ships as a package in Python, TypeScript/JavaScript, Rust, Go, Zig, Lua and Elixir, published on PyPI, npm, crates.io, pkg.go.dev, LuaRocks and Hex. All seven read and write the same .GCC/ layout, so a workspace created in one language can be read or extended by any other. The CONTEXT call returns a formatted context block ready to inject into a prompt, and the source paper's experiments find that K=1, the most recent commit only, performs best in most benchmarks.

## What the original paper reports

The GCC framework is evaluated in arXiv:2508.00031 by its authors, not in this repository. It reports 80.2% on SWE-Bench Verified with Claude 4 Sonnet and 83.4% on BrowseComp-Plus with GPT-5, with each component contributing incrementally. Those numbers belong to the paper; the contribution here is the open, cross-language implementation of the format.`,
    url: "",
    github: "https://github.com/swadhinbiswas/contexa",
    image: null,
    tags: JSON.stringify([
      "ai",
      "llm-agents",
      "memory",
      "context-management",
      "git",
      "multi-language",
      "open-source",
      "research",
    ]),
    category: "ai-ml",
    featured: 1,
    status: "Active",
    project_date: null,
    stars: 8,
    order: 9,
    tech_stack: JSON.stringify([
      "Python",
      "TypeScript",
      "Rust",
      "Go",
      "Zig",
      "Lua",
      "Elixir",
      "Markdown",
      "YAML",
    ]),
    demo_url: null,
    documentation: null,
    metrics: JSON.stringify({
      implementations: "7 languages",
      "shared format": ".GCC/ (Markdown + YAML)",
      "memory tiers": "3",
      "context resolution": "K (default 1)",
      paper: "arXiv:2508.00031",
      license: "MIT",
      repository_status: "Active",
    }),
    gallery: "[]",
    team_size: 1,
    duration: null,
    role: "Creator & maintainer",
    challenges: `- **Seven languages, one byte-compatible format.** Every implementation has to produce the same .GCC/ filesystem layout so a workspace written in one language can be read by another, which means the data model has to be pinned in each language's own idioms.
- **Keeping memory human-readable.** Markdown and YAML storage costs some compactness, but it makes agent memory directly inspectable, which matters more for a debugging surface.
- **Deciding how much history to retrieve.** The paper's finding that K=1 is optimal is counter-intuitive; making it the documented default meant trusting the evaluation over intuition.`,
    outcomes: `- Seven interoperable packages published across PyPI, npm, crates.io, pkg.go.dev, LuaRocks and Hex.
- A single .GCC/ on-disk format shared by all implementations.
- A documented command model (OTA Log, COMMIT, BRANCH, MERGE, CONTEXT) mapped onto the original paper.
- Human-readable Markdown and YAML storage that can be debugged in any editor.
- MIT-licensed and open to contributions, with a citation back to the source paper.`,
    lessons_learned: `- **Cross-language format parity is the real work.** The algorithms are small; keeping seven implementations honest about one on-disk contract is what takes the effort.
- **Prefer the inspectable format.** Human-readable storage makes an agent's memory a debugging surface rather than a black box.
- **Attribute research to its authors.** The benchmark results belong to the paper, so the repository presents them as the paper's findings and keeps its own claims to the implementation.`,
  },
  {
    name: "Eco-Guard",
    slug: "ecoguard",
    description:
      "A self-hosted LLM inference gateway and MLOps control plane: an OpenAI-compatible API with multi-backend routing, content guardrails, cost tracking, a model registry with canary and blue-green deploys, and Prometheus and OpenTelemetry observability.",
    content: `Eco-Guard is a control plane for serving, observing and managing LLM inference on your own infrastructure. It presents an OpenAI-compatible API, routes to whichever inference backend you run, adds content safety and cost governance in front of it, and manages the model lifecycle behind it. The whole platform deploys as a single Docker container.

## The inference gateway

The API is a drop-in for the OpenAI chat completions, embeddings and models endpoints, so any OpenAI SDK client works unchanged. Behind that surface it routes to llama.cpp, Ollama, vLLM, Hugging Face TGI or any OpenAI-compatible endpoint through a common backend interface, which means backends can be hot-swapped without a restart. It supports streaming over server-sent events, model-specific chat templates for Llama 3, Mistral, ChatML, Gemma and Zephyr, OpenAI-compatible function calling, batch inference of up to 100 prompts, and fallback chains with per-step timeouts.

## Content safety

A guardrails pipeline runs with per-stage actions: block, flag, sanitize or allow. It detects prompt injection and jailbreak patterns, redacts PII such as card numbers, emails, phone numbers and IP addresses, classifies self-harm, violence and hate speech, and flags prompt anomalies like spam floods and unusual token counts.

## Cost and governance

Per-model pricing is pre-configured, requests can be compared across six providers before they run, and workspaces carry budget caps with alert thresholds. Token counting uses tiktoken with a heuristic fallback, every administrative action is audit-logged, and GDPR export and deletion endpoints are built in.

## MLOps

A model registry moves models through Registered, Staging, Production and Archived with checksum verification and rollbacks. Deployments support direct, canary, blue-green and A/B strategies, with automated evaluation gating rollouts on pass or fail thresholds. Drift detection uses a statistical Z-score and can trigger retraining, experiments log metrics per step, and a leaderboard ranks models by latency, accuracy, token efficiency and drift. There is also a RAG pipeline for ingestion, chunking, embedding and retrieval.

## Observability and platform

Prometheus metrics, OpenTelemetry tracing with an OTLP exporter, structured JSON logs with request correlation, a real-time WebSocket for live metrics and a 17-panel Grafana dashboard. On the platform side there is multi-tenancy with roles and token quotas, JWT cookies with brute-force protection and scrypt hashing, hashed API keys, Google and GitHub SSO, a Redis-backed sliding-window rate limiter and circuit breaker, CIDR IP allowlisting, and GitOps configuration with hot reload. The security posture is explicit: no analytics, no tracking, no phone-home.

## Deployment

Docker Compose brings up the API with PostgreSQL 15 and Redis 7 with health checks and migrations. A Helm chart adds a Deployment, Service, Ingress, HorizontalPodAutoscaler, NetworkPolicy, PodDisruptionBudget, ServiceMonitor and PersistentVolumeClaim, and a Terraform module covers infrastructure as code.`,
    url: "",
    github: "https://github.com/swadhinbiswas/Ecoguard",
    image: null,
    tags: JSON.stringify([
      "ai",
      "llm",
      "inference-gateway",
      "mlops",
      "guardrails",
      "observability",
      "kubernetes",
      "self-hosted",
      "python",
    ]),
    category: "ai-ml",
    featured: 1,
    status: "Active",
    project_date: null,
    stars: 1,
    order: 10,
    tech_stack: JSON.stringify([
      "Python",
      "FastAPI",
      "Vue 3",
      "PostgreSQL",
      "Redis",
      "Docker",
      "Kubernetes",
      "Terraform",
      "Prometheus",
      "OpenTelemetry",
      "llama.cpp",
      "Ollama",
      "vLLM",
      "Hugging Face",
    ]),
    demo_url: null,
    documentation: null,
    metrics: JSON.stringify({
      "api endpoints": "208",
      routers: "12",
      "test suite": "173 tests",
      "frontend pages": "16",
      "db migrations": "8",
      backends: "llama.cpp, Ollama, vLLM, TGI, OpenAI-compatible",
      license: "MIT",
      repository_status: "Active",
    }),
    gallery: "[]",
    team_size: 1,
    duration: null,
    role: "Creator & maintainer",
    challenges: `- **Hot-swapping inference backends.** Different engines expose different APIs, so a common backend interface with OpenAI compatibility on the outside was the only way to change engines without touching clients or restarting.
- **Shared state across workers.** Rate limits, circuit breakers and WebSocket broadcasts cannot live in process memory once more than one worker runs, so they are Redis-backed with an in-memory fallback for single-process use.
- **Content safety without leaking data.** Guardrails have to catch injection and PII while processing prompts locally, which rules out a third-party safety API for a self-hosted product.
- **Cost governance across tenants.** Budget caps, token counting and per-model pricing all have to hold per workspace, not globally.`,
    outcomes: `- 208 API endpoints across 12 routers, covering inference, MLOps, enterprise administration, production traces and a toolkit layer.
- 173 tests across unit, integration and end-to-end suites.
- A 16-page Vue 3 dashboard plus a Python SDK and CLI that drop in for the OpenAI SDK.
- Docker Compose, a Helm chart and a Terraform module for deployment.
- GDPR export and right-to-deletion endpoints, audit logging, and a documented no-telemetry policy.
- A 17-panel Grafana dashboard and Prometheus alerts shipped in the repo.`,
    lessons_learned: `- **Process memory is not shared state.** Once the deployment runs more than one worker, every rate limit and breaker has to move to Redis, with an explicit single-process fallback.
- **Hashing is the default for secrets.** API keys are stored as SHA-256 hashes and admin passwords use scrypt, so a database leak does not hand over credentials.
- **A self-hosted product should not phone home.** No analytics, no tracking and local-only guardrails are part of the product, not an afterthought.
- **Ship the operations, not just the app.** A Helm chart, migrations, health checks and a Grafana dashboard are what make it deployable.`,
  },
];

const columns = [
  "name",
  "slug",
  "description",
  "content",
  "url",
  "github",
  "image",
  "tags",
  "category",
  "featured",
  "status",
  "project_date",
  "stars",
  "order",
  "tech_stack",
  "demo_url",
  "documentation",
  "metrics",
  "gallery",
  "team_size",
  "duration",
  "role",
  "challenges",
  "outcomes",
  "lessons_learned",
];
const q = (c) => '"' + c + '"';

for (const p of items) {
  const values = columns.map((c) => p[c] ?? null);
  const placeholders = columns.map(() => "?").join(", ");
  const updates = columns
    .filter((c) => c !== "slug")
    .map((c) => `${q(c)} = excluded.${q(c)}`)
    .join(", ");
  await client.execute({
    sql: `INSERT INTO projects (${columns.map(q).join(", ")}) VALUES (${placeholders}) ON CONFLICT(slug) DO UPDATE SET ${updates}, "updated_at" = CURRENT_TIMESTAMP`,
    args: values,
  });
  log(`  upserted: ${p.name} (${p.slug})`);
}

// Curate the home order so the flagship projects lead.
const homeOrder = {
  "eu-air-traffic": 1,
  terrasentinel: 2,
  eurostream: 3,
  opencodehub: 4,
  justapi: 5,
  aurora: 6,
  opengrammar: 7,
  aegisvision: 8,
  contexa: 9,
  ecoguard: 10,
  veet: 11,
};
for (const [slug, order] of Object.entries(homeOrder)) {
  await client.execute({
    sql: 'UPDATE projects SET "order" = ? WHERE slug = ?',
    args: [order, slug],
  });
}
log("home order curated for 11 projects");

// The table default is the literal string 'CURRENT_TIMESTAMP', which the
// project pages cannot parse as a date. Normalise any row that received it.
await client.execute(
  "UPDATE projects SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE created_at = 'CURRENT_TIMESTAMP'",
);
await client.execute(
  "UPDATE projects SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE updated_at = 'CURRENT_TIMESTAMP'",
);
log("normalised created_at / updated_at");

client.close();
log("done.");
