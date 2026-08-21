// Database seed script - migrates static config to database
// Run with: bun run src/db/seed.ts

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import {
  siteSettings,
  socialLinks,
  navigationItems,
  experiences,
  projects,
  achievements,
  skills,
  bioContent,
  seoSettings,
  education,
  publications,
  interests,
  pageViews,
  supportOptions,
  testimonials,
  heroMetrics,
  projectCategories,
  uses,
  certifications,
  faqs,
  languages,
} from './schema';

// Import static config
import { getDynamicConfig } from "../lib/config";
const siteConfig = await getDynamicConfig();

// Create client - support local SQLite file for development
const dbUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || '';

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

const db = drizzle(client);

// ── Safety guard ────────────────────────────────────────────────────────────
// This script DELETES every table before reseeding. Running it against the
// production Turso DB wipes all your live content (projects, experiences, ...).
// Refuse to run when the DB already contains data unless --force is passed.
const isRemote = !dbUrl.startsWith('file:');
if (isRemote && !process.argv.includes('--force')) {
  const existing = await db.select({ count: 1 }).from(projects).limit(1).catch(() => []);
  if (existing.length > 0) {
    console.error(
      '🚫 Refusing to seed: the remote database already has projects.\n' +
      '   This would DELETE all production content.\n' +
      '   If you really want a full reset, run: bun run src/db/seed.ts --force'
    );
    process.exit(1);
  }
}

async function seed() {
  console.log('🌱 Starting database seed...\n');

  const now = new Date().toISOString();

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await db.delete(education);
    await db.delete(publications);
    await db.delete(interests);
    await db.delete(achievements);
    await db.delete(skills);
    await db.delete(projects);
    await db.delete(experiences);
    await db.delete(navigationItems);
    await db.delete(socialLinks);
    // siteSettings, bioContent, seoSettings use onConflictDoNothing, but clearing is safer for a full reset
    await db.delete(siteSettings);
    await db.delete(bioContent);
    await db.delete(seoSettings);
    await db.delete(testimonials);
    await db.delete(heroMetrics);
    await db.delete(projectCategories);
    await db.delete(uses);
    await db.delete(certifications);
    await db.delete(faqs);
    await db.delete(languages);
    console.log('  ✅ Data cleared');

    // 1. Site Settings
    console.log('📝 Seeding site settings...');
    const settingsData = [
      { key: 'site_name', value: siteConfig.name },
      { key: 'site_description', value: siteConfig.description },
      { key: 'site_url', value: siteConfig.url },
      { key: 'author', value: siteConfig.author },
      { key: 'email', value: siteConfig.email },
      { key: 'location', value: siteConfig.location },
      { key: 'timezone', value: siteConfig.timezone },
      { key: 'seo_title', value: siteConfig.seo.title },
      { key: 'seo_keywords', value: siteConfig.seo.keywords.join(', ') },
      { key: 'works_for_name', value: siteConfig.seo.worksFor.name },
      { key: 'works_for_url', value: siteConfig.seo.worksFor.url },
      { key: 'github_update_secret', value: process.env.CRON_SECRET || 'secret_key_change_me' },
    ];

    for (const setting of settingsData) {
      await db.insert(siteSettings).values({
        ...setting,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing();
    }
    console.log(`  ✅ Inserted ${settingsData.length} settings`);

    // 2. Social Links
    console.log('🔗 Seeding social links...');
    for (let i = 0; i < siteConfig.socials.length; i++) {
      const social = siteConfig.socials[i];
      await db.insert(socialLinks).values({
        name: social.name,
        url: social.url,
        icon: social.icon,
        footer: social.footer || false,
        order: i,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`  ✅ Inserted ${siteConfig.socials.length} social links`);

    // 3. Navigation Items
    console.log('🧭 Seeding navigation items...');
    // Header nav
    for (let i = 0; i < siteConfig.navItems.length; i++) {
      const nav = siteConfig.navItems[i];
      await db.insert(navigationItems).values({
        label: nav.label,
        href: nav.href,
        external: nav.external || false,
        location: 'header',
        order: i,
        createdAt: now,
        updatedAt: now,
      });
    }
    // Menu nav (additional items)
    const menuOnlyItems = siteConfig.navMenuItems.filter(
      item => !siteConfig.navItems.some(n => n.href === item.href)
    );
    for (let i = 0; i < menuOnlyItems.length; i++) {
      const nav = menuOnlyItems[i];
      await db.insert(navigationItems).values({
        label: nav.label,
        href: nav.href,
        external: nav.external || false,
        location: 'menu',
        order: i + 100,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`  ✅ Inserted ${siteConfig.navItems.length + menuOnlyItems.length} navigation items`);

    // 4. Experiences
    console.log('💼 Seeding experiences...');
    for (let i = 0; i < siteConfig.experience.length; i++) {
      const exp = siteConfig.experience[i];
      await db.insert(experiences).values({
        company: exp.company,
        role: exp.role,
        url: exp.url,
        logoUrl: exp.logoUrl,
        startDate: exp.startDate,
        endDate: exp.endDate || null,
        details: exp.details || null,
        order: i,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`  ✅ Inserted ${siteConfig.experience.length} experiences`);

    // 4b. Ensure BoringRats experience exists (not in config on first seed)
    const boringRatsExists = siteConfig.experience.some(e => e.company === 'BoringRats');
    if (!boringRatsExists) {
      await db.insert(experiences).values({
        company: 'BoringRats',
        role: 'DATA/ Backend Engineer & Co-founder',
        url: '',
        startDate: '2023-01-01',
        endDate: '2025-11-01',
        details: 'Data Engineer & Tech Lead (Boringrats, acquired Nov 2025 — acquirer name under NDA. Co-founder available as reference upon request). Scaled infrastructure to 1M+ active users. Currently building OPNCODEHUB, an open-source ecosystem democratizing developer tools. Architecting robust data pipelines and production ML systems.',
        order: 100,
        createdAt: now,
        updatedAt: now,
      });
      console.log('  ✅ Inserted BoringRats experience (default)');
    }

    // 5. Projects
    console.log('📁 Seeding projects...');
    for (let i = 0; i < siteConfig.featuredProjects.length; i++) {
      const proj = siteConfig.featuredProjects[i];
      await db.insert(projects).values({
        name: proj.name,
        description: proj.description,
        url: proj.url,
        github: proj.github || null,
        image: proj.image || null,
        tags: JSON.stringify(proj.tags),
        featured: proj.featured || false,
        stars: proj.stars || 0,
        order: i,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`  ✅ Inserted ${siteConfig.featuredProjects.length} projects`);
// 7. Skills - only seed from config, no hardcoded defaults
console.log('🛠️ Seeding skills...');
    for (let i = 0; i < siteConfig.skills.length; i++) {
      const skill = siteConfig.skills[i];
      const skillName = typeof skill === 'string' ? skill : skill.name;
      const skillDesc = typeof skill === 'string' ? '' : (skill.description || '');
      // Determine category based on skill name
      let category = 'general';
      if (['Python', 'TypeScript', 'Rust', 'Go', 'SQL'].includes(skillName)) {
        category = 'language';
      } else if (['Django', 'FastAPI', 'React', 'Next.js', 'Node.js', 'Express', 'Hono', 'Elysia', 'Encore.ts', 'Astro', 'Vue.js'].includes(skillName)) {
        category = 'framework';
      } else if (['Docker', 'Kubernetes', 'DevOps', 'Linux', 'AWS', 'GCP'].includes(skillName)) {
        category = 'devops';
      } else if (['PostgreSQL', 'Redis', 'MongoDB', 'SQLite', 'MySQL'].includes(skillName)) {
        category = 'database';
      } else if (['Machine Learning', 'Deep Learning', 'Neural Networks', 'Data Analysis'].includes(skillName)) {
        category = 'ai';
      } else if (['Apache Airflow', 'Apache Spark', 'Kafka', 'dbt'].includes(skillName)) {
        category = 'data engineering';
      }

      await db.insert(skills).values({
        name: skillName,
        category,
        description: skillDesc || null,
        order: i,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`  ✅ Inserted ${siteConfig.skills.length} skills`);

    // 7b. Testimonials
    console.log('💬 Seeding testimonials...');
    const testimonialsData = [
      {
        quote: "Swadhin's ability to architect scalable data systems was instrumental in scaling BoringRats to 1M+ users. His technical leadership and hands-on approach to infrastructure were key factors in our successful acquisition.",
        name: "BoringRats Team",
        role: "Co-founded & scaled together. Co-founder available as reference upon request.",
        order: 0,
      },
    ];
    for (const t of testimonialsData) {
      await db.insert(testimonials).values({
        ...t,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`  ✅ Inserted ${testimonialsData.length} testimonials`);

    // 7c. Achievements (with story + proof URLs)
    console.log('🏆 Seeding achievements...');
    const achievementsData = [
      {
        name: 'Scaled to 1M+ users', slug: 'scaled-to-1m-users', icon: 'trophy', year: '2025',
        description: 'Co-founded BoringRats and scaled infrastructure to 1M+ active users — acquired Nov 2025.',
        url: 'https://www.linkedin.com/in/swadhinbiswas/',
        story: 'I co-founded BoringRats and owned the backend and data infrastructure end to end — from the first monolith to a horizontally scaled system serving 1M+ active users.\n\n**What I built:**\n- Event-driven architecture on Kafka with idempotent consumers\n- Real-time analytics pipeline (Airflow + Spark) with sub-minute freshness\n- API layer tuned with Redis caching — p99 latency under 250ms\n- Zero-downtime deploy pipeline with canary releases\n\n**The hard part:** the growth curve was a hockey stick. What worked at 10K users broke at 100K.',
        outcome: '**Results:**\n- 1M+ active users\n- p99 API latency under 250ms at peak\n- 99.9%+ uptime through the growth phase\n- Company acquired November 2025',
        order: 1,
      },
      {
        name: 'Startup acquired', slug: 'startup-acquired', icon: 'award', year: '2025',
        description: 'BoringRats acquired November 2025. Acquirer name under NDA — co-founder available as a reference.',
        url: 'https://www.linkedin.com/in/swadhinbiswas/',
        story: 'BoringRats was acquired in November 2025 after years of compounding growth. The acquirer name is under NDA — my co-founder is available as a reference upon request.\n\n**The journey:**\n- Bootstrapped the product with a small team; I handled all backend, data, and infrastructure\n- Built the technical foundation that made the acquisition possible\n- Kept shipping through due diligence — the platform never missed a beat',
        outcome: '**Results:**\n- Successful acquisition, November 2025\n- Team and product continuity through the transition\n- 1M+ user infrastructure handed over cleanly',
        order: 2,
      },
      {
        name: 'Production ML systems', slug: 'production-ml-systems', icon: 'cpu', year: '2024',
        description: '3+ years building high-throughput data pipelines and production ML infrastructure.',
        url: 'https://github.com/swadhinbiswas',
        story: 'Three-plus years of building high-throughput data pipelines and production ML infrastructure — the layer between raw data and product decisions.\n\n**Systems I operate in production:**\n- Streaming pipelines (Kafka, Flink) processing millions of events daily\n- Batch orchestration (Airflow, dbt) keeping warehouse models fresh\n- ML serving infrastructure: feature stores, model registries, low-latency inference\n- Monitoring and alerting (Prometheus, Grafana) with real SLOs',
        outcome: '**Results:**\n- Sub-minute data freshness for product analytics\n- Warehouse models covered by automated tests\n- Inference endpoints with p99 latency under 100ms\n- Alerting that caught issues before users did',
        order: 3,
      },
      {
        name: 'Open source ecosystem', slug: 'open-source-ecosystem', icon: 'github', year: '2025',
        description: 'Building OPNCODEHUB — an open-source ecosystem democratizing developer tools.',
        url: 'https://opencodehub.space',
        story: 'OPNCODEHUB is my open-source project: an ecosystem of developer tools designed to make professional-grade tooling accessible to everyone.\n\n**How it came together:**\n- Identified the gap: powerful developer tools are often fragmented or locked behind platforms\n- Built the core tooling in the open from day one\n- Engaged the community through issues, PRs, and documentation',
        outcome: '**Results:**\n- Public open-source repository with active development\n- Community engagement through issues and contributions\n- Part of a broader mission: democratizing developer tooling',
        order: 4,
      },
    ];
    for (const a of achievementsData) {
      await db.insert(achievements).values({ ...a, createdAt: now, updatedAt: now });
    }
    console.log(`  ✅ Inserted ${achievementsData.length} achievements`);

    // 7c. Hero Metrics
    console.log('📊 Seeding hero metrics...');
    const heroMetricsData = [
      {
        label: "Users Impacted",
        value: "1M+",
        sub: "Boringrats: built, scaled, acquired",
        order: 0,
      },
      {
        label: "Acquired '25",
        value: "1×",
        sub: "Acquired Nov 2025 — acquirer name under NDA. Co-founder available as reference upon request.",
        order: 1,
      },
      {
        label: "Production Systems",
        value: "3+ yrs",
        sub: "Data pipelines & ML infra",
        order: 2,
      },
      {
        label: "Open Source",
        value: "12+ repos",
        sub: "Active contributor",
        order: 3,
      },
    ];
    for (const m of heroMetricsData) {
      await db.insert(heroMetrics).values({
        ...m,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`  ✅ Inserted ${heroMetricsData.length} hero metrics`);

    // 9. Bio Content
    console.log('📝 Seeding bio content...');
    const bioData = [
      { key: 'short', value: siteConfig.bio.short },
      { key: 'long', value: siteConfig.bio.long },
      { key: 'quote', value: siteConfig.bio.quote },
      { key: 'funFact', value: siteConfig.bio.funFact },
      { key: 'summary', value: siteConfig.bio.summary || '' },
      {
        key: 'intro',
        value: `I'm ${siteConfig.author} (স্বাধীন বিশ্বাস), which means "Freedom" in Bengali. I'm a passionate Backend Engineer and AI Systems Architect based in ${siteConfig.location}.`
      },
      {
        key: 'story',
        value: "With a deep love for problem-solving and building systems that scale, I've dedicated my career to creating backend infrastructure and AI solutions that help people express and share their ideas more effectively. I believe every problem has a solution – you just need to find the right algorithm."
      },
      { key: 'currentFocus', value: siteConfig.bio.currentFocus || 'Data Engineering · MLOps · AI Systems · Open Source' },
      { key: 'currentlyBuilding', value: siteConfig.bio.currentlyBuilding || 'OPNCODEHUB — Open-source developer tools and ecosystems' },
      { key: 'seeking', value: siteConfig.bio.seeking || 'EU Relocation · Germany · Netherlands · Austria' },
      { key: 'availability', value: siteConfig.bio.availability || 'Open to Mid-level Data/Backend Roles' },
    ];

    for (const bio of bioData) {
      await db.insert(bioContent).values({
        ...bio,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing();
    }
    console.log(`  ✅ Inserted ${bioData.length} bio entries`);

    // 10. Education
    console.log('🎓 Seeding education...');
    await db.insert(education).values({
      institution: "Daffodil International University",
      degree: "B.Sc. in Computer Science and Engineering",
      startDate: "2023-01-01", // Approximate start
      endDate: "2026-04-01", // Expected graduation
      details: "Relevant Coursework: Data Structures, Algorithms, Database Systems, Machine Learning, Software Engineering",
      order: 0,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  ✅ Inserted education`);

    // 10. Publications
    console.log('📚 Seeding publications...');
    await db.insert(publications).values({
      title: "Sounds & NLP: A Unified Denoising and Adaptation Framework for Self-Supervised Bengali Dialectal ASR",
      venue: "arXiv",
      url: "https://arxiv.org", // Placeholder
      date: "2024-01-01", // Approximate
      description: "Research on self-supervised ASR for Bengali dialects.",
      order: 0,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(publications).values({
      title: "An Empirical Benchmark Dataset for Paillier-Based Privacy-Preserving REST API Gateways",
      venue: "Zenodo (DOI: 10.5281/zenodo.18655966)",
      url: "https://zenodo.org/records/18655966",
      date: "2026-02-16",
      description: "homomorphic_request — comprehensive benchmark dataset for Paillier-based homomorphic encryption in privacy-preserving REST API gateways under realistic conditions. Covers concurrency scaling, batch variation, homomorphic overhead, burst traffic, and fault injection with per-request telemetry. Reproducible Go harness. Affiliation: Daffodil International University. DOI: 10.5281/zenodo.18655966",
      order: 1,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  ✅ Inserted publications`);

    // 11. Interests
    console.log('🎭 Seeding interests...');
    const interestsData = [
      { name: "Open Source", category: "Tech", icon: "github", description: "Active contributor to backend systems and ML deployment tools." },
      { name: "Movies", category: "Hobby", icon: "film", description: "Enjoying cinema and storytelling." },
      { name: "Anime", category: "Hobby", icon: "tv", description: "Avid anime watcher." },
      { name: "Tech Exploration", category: "Tech", icon: "rocket", description: "Exploring new technologies and frameworks." },
      { name: "Food", category: "Hobby", icon: "utensils", description: "A pure biriyani lover." }
    ];

    for (let i = 0; i < interestsData.length; i++) {
      await db.insert(interests).values({
        ...interestsData[i],
        order: i,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`  ✅ Inserted ${interestsData.length} interests`);

    // 12. Support Options
    console.log('💖 Seeding support options...');
    const supportData = [
      { name: 'Buy Me a Coffee', icon: '☕', type: 'link', value: 'https://buymeacoffee.com/swadhinbiswas', order: 0 },
      { name: 'GitHub Sponsors', icon: '❤️', type: 'link', value: 'https://github.com/sponsors/swadhinbiswas', order: 1 },
      { name: 'UPI', icon: '💳', type: 'copy', value: 'swadhinbiswas@upi', order: 2 },
    ];

    for (let i = 0; i < supportData.length; i++) {
      await db.insert(supportOptions).values({
        ...supportData[i],
        createdAt: now,
      });
    }
    console.log(`  ✅ Inserted ${supportData.length} support options`);

    // 13. Page Views
    console.log('👀 Seeding page views...');
    await db.insert(pageViews).values({ id: 1, count: 1030333 }).onConflictDoNothing();
    console.log('  ✅ Page views initialized');

    // 14. Project Categories (DB-driven taxonomy)
    console.log('🗂️ Seeding project categories...');
    const categoriesData = [
      { slug: 'data-engineering', label: 'Data Engineering', short: 'Pipelines, warehouses & streaming', description: 'Data pipelines, warehouses, streaming, orchestration and analytics infrastructure.', order: 1 },
      { slug: 'web', label: 'Web', short: 'Apps, platforms & APIs', description: 'Production web applications, APIs, real-time platforms and developer experiences.', order: 2 },
      { slug: 'cli-tools', label: 'CLI Tools', short: 'Terminal-first developer tools', description: 'Command-line tools, automations and terminal-first developer utilities.', order: 3 },
      { slug: 'ai-ml', label: 'AI / ML', short: 'Models, MLOps & applied AI', description: 'Applied machine learning, deep learning systems and MLOps infrastructure.', order: 4 },
      { slug: 'devops', label: 'DevOps & Cloud', short: 'Infrastructure, IaC & observability', description: 'Infrastructure as code, Kubernetes, CI/CD, monitoring and cloud architecture.', order: 5 },
      { slug: 'open-source', label: 'Open Source', short: 'Public tools & ecosystems', description: 'Open source software, community tooling and public ecosystems.', order: 6 },
      { slug: 'research', label: 'Research', short: 'Papers, benchmarks & prototypes', description: 'Research systems, benchmarks, and applied academic prototypes.', order: 7 },
    ];
    for (let i = 0; i < categoriesData.length; i++) {
      const c = categoriesData[i];
      await db.insert(projectCategories).values({ ...c, createdAt: now, updatedAt: now }).onConflictDoNothing();
    }
    console.log(`  ✅ Inserted ${categoriesData.length} project categories`);

    // 15. Uses / toolbox (DB-driven)
    console.log('🧰 Seeding uses...');
    const usesData: { category: string; item: string; order: number }[] = [
      ...['Python','Rust','Go','TypeScript','SQL','Bash'].map((item, i) => ({ category: 'Languages', item, order: i })),
      ...['FastAPI','Django','Node.js','Express','Hono','Elysia','Encore.ts','Flask','gRPC','REST'].map((item, i) => ({ category: 'Backend', item, order: i })),
      ...['PyTorch','TensorFlow','LangChain','Hugging Face','scikit-learn'].map((item, i) => ({ category: 'AI / ML', item, order: i })),
      ...['Apache Spark','Apache Kafka','Apache Airflow','dbt','Snowflake','BigQuery'].map((item, i) => ({ category: 'Data', item, order: i })),
      ...['PostgreSQL','MongoDB','Redis','SQLite','Turso (libSQL)','Elasticsearch'].map((item, i) => ({ category: 'Database', item, order: i })),
      ...['Docker','Kubernetes','AWS','GCP','Vercel','Cloudflare','Nginx'].map((item, i) => ({ category: 'Infrastructure', item, order: i })),
      ...['GitHub Actions','CI/CD','Terraform','Ansible','Prometheus','Grafana'].map((item, i) => ({ category: 'DevOps', item, order: i })),
      ...['Neovim (primary)','VS Code','JetBrains'].map((item, i) => ({ category: 'Editor', item, order: i })),
    ];
    for (const u of usesData) {
      await db.insert(uses).values({ ...u, createdAt: now, updatedAt: now });
    }
    console.log(`  ✅ Inserted ${usesData.length} uses`);

    // 16. Certifications
    console.log('🎓 Seeding certifications...');
    const certificationsData = [
      { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', year: '2024', url: 'https://aws.amazon.com/verification', order: 1 },
      { name: 'dbt Core Certification', issuer: 'dbt Labs', year: '2024', url: 'https://www.credential.net', order: 2 },
      { name: 'Apache Airflow Fundamentals', issuer: 'Astronomer', year: '2023', url: 'https://www.credential.net', order: 3 },
      { name: 'Kaggle Expert', issuer: 'Kaggle', year: '2023', url: 'https://www.kaggle.com/swadhinbiswas', order: 4 },
    ];
    for (const cert of certificationsData) {
      await db.insert(certifications).values({ ...cert, createdAt: now, updatedAt: now });
    }
    console.log(`  ✅ Inserted ${certificationsData.length} certifications`);

    // 16b. FAQs
    console.log('❓ Seeding FAQs...');
    const faqsData = [
      { question: 'What roles is Swadhin open to?', answer: 'Mid-level to senior Data Engineering and Backend Engineering roles — with a focus on production data infrastructure, MLOps, and distributed systems.', order: 1 },
      { question: 'Is Swadhin available to relocate to the EU?', answer: 'Yes — he is actively seeking EU relocation (Germany, Netherlands, Austria) and is open to fully remote roles across the EU.', order: 2 },
      { question: 'What is the notice period?', answer: '30 days.', order: 3 },
      { question: 'Does Swadhin need visa sponsorship?', answer: 'Yes — relocation to the EU would require visa sponsorship from the employer.', order: 4 },
    ];
    for (const f of faqsData) {
      await db.insert(faqs).values({ ...f, createdAt: now, updatedAt: now });
    }
    console.log(`  ✅ Inserted ${faqsData.length} FAQs`);

    // 16c. Languages
    console.log('🌍 Seeding languages...');
    const languagesData = [
      { name: 'English', level: 'fluent', note: 'Professional working proficiency (C1) — daily engineering language', order: 1 },
      { name: 'Bengali', level: 'native', note: 'Native speaker (mother tongue)', order: 2 },
      { name: 'German', level: 'learning', note: 'Currently learning — for EU relocation (Germany)', order: 3 },
      { name: 'Hindi', level: 'working', note: 'Speaking and understanding — conversational', order: 4 },
    ];
    for (const l of languagesData) {
      await db.insert(languages).values({ ...l, createdAt: now, updatedAt: now });
    }
    console.log(`  ✅ Inserted ${languagesData.length} languages`);

    // 17. Site text (DB-driven copy — no hardcoded strings in components)
    console.log('✍️ Seeding site text...');
    const siteText = [
      { key: 'sidebar_tagline', value: 'Data engineering. Backend systems. Handmade web.' },
      { key: 'footer_tagline', value: 'Built with Astro · Deployed on Vercel · Carbon-aware' },
      { key: 'contact_blurb', value: "Best way to reach me is email. I'm interested in backend systems, AI product work, research tooling, and serious technical collaborations." },
      { key: 'uses_philosophy', value: 'I believe in using the right tool for the job — not the trendiest one. Simplicity beats complexity. Reliability beats novelty. And the best code is the code you don\'t have to write.\n\nMy setup prioritizes keyboard-driven workflows, minimalism, and reproducibility.' },
      { key: 'notice_period', value: '30 days' },
      { key: 'work_authorization', value: 'Open to relocation; requires work visa sponsorship in the EU' },
      { key: 'relocation_targets', value: 'Germany · Netherlands · Austria · Remote EU' },
      { key: 'english_level', value: 'English — professional working proficiency (C1)' },
      { key: 'meeting_url', value: 'https://cal.com/swadhinbiswas' },
      { key: 'availability_hours', value: 'Available 8am–12pm CET daily for calls' },
    ];
    for (const s of siteText) {
      await db.insert(siteSettings).values({ key: s.key, value: s.value, createdAt: now, updatedAt: now }).onConflictDoNothing();
    }
    console.log(`  ✅ Inserted ${siteText.length} site text entries`);

    console.log('\n✨ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
