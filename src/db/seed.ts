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
  galleryPhotos,
  books,
  workshopProjects,
} from './schema';

import { defaultPhotosList } from '../lib/photos';

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
        order: i + 1,
        createdAt: now,
        updatedAt: now,
      });
    }
    // Creative nav
    const creativeNav = siteConfig.creativeNavItems || [];
    for (let i = 0; i < creativeNav.length; i++) {
      const nav = creativeNav[i];
      await db.insert(navigationItems).values({
        label: nav.label,
        href: nav.href,
        external: nav.external || false,
        location: 'creative',
        order: i + 10,
        createdAt: now,
        updatedAt: now,
      });
    }
    // Menu nav (additional items)
    const menuOnlyItems = siteConfig.navMenuItems.filter(
      item => !siteConfig.navItems.some(n => n.href === item.href) && !creativeNav.some(c => c.href === item.href)
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
    console.log(`  ✅ Inserted ${siteConfig.navItems.length + creativeNav.length + menuOnlyItems.length} navigation items`);

    // 3c. Gallery Photos
    console.log('📷 Seeding gallery photos...');
    for (const photo of defaultPhotosList) {
      await db.insert(galleryPhotos).values({
        slug: photo.slug || photo.id,
        title: photo.title,
        url: photo.url,
        thumb: photo.thumb || photo.url,
        mediaType: photo.mediaType || 'image',
        category: photo.category || 'nature',
        categoryLabel: photo.categoryLabel || 'Photography',
        location: photo.location || 'Bangladesh',
        year: photo.year || '2026',
        camera: photo.exif?.camera || 'Digital Sensor',
        lens: photo.exif?.lens || 'Prime Lens',
        aperture: photo.exif?.aperture || 'ƒ/1.8',
        shutter: photo.exif?.shutter || '1/120s',
        iso: photo.exif?.iso || 'ISO 200',
        focal: photo.exif?.focal || '26mm',
        story: photo.story || 'Captured on location.',
        aspect: photo.aspect || 'wide',
        featured: photo.featured ? 1 : 0,
        order: photo.order || 0,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`  ✅ Inserted ${defaultPhotosList.length} gallery photos`);

    // 3d. Technical Books & Audiobooks
    console.log('📚 Seeding technical books & audiobooks...');
    const initialBooks = [
      {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        type: 'read',
        category: 'Distributed Systems',
        status: 'completed',
        rating: 5,
        url: 'https://dataintensive.net/',
        takeaway: 'The book that shaped how I think about distributed data. Consensus, Raft and Paxos leader election, linearizability versus serializability, and Kafka\'s stream-table duality are the parts I still use.',
        featured: true,
        order: 1
      },
      {
        title: 'Database Internals',
        author: 'Alex Petrov',
        type: 'read',
        category: 'Database Architecture',
        status: 'completed',
        rating: 5,
        url: 'https://www.databass.dev/',
        takeaway: 'A close look at how storage engines are built. It made B-trees versus LSM-trees (SSTables, MemTables, compaction), page cache buffering, write-ahead logs, and replication topologies click for me.',
        featured: true,
        order: 2
      },
      {
        title: 'Site Reliability Engineering: How Google Runs Production Systems',
        author: 'Betsy Beyer, Chris Jones, Niall Murphy',
        type: 'listened',
        category: 'Systems & Reliability',
        status: 'completed',
        rating: 5,
        url: 'https://sre.google/sre-book/table-of-contents/',
        takeaway: 'Where I picked up error budgets, SLOs, and blameless postmortems. The main idea, that operations is an engineering problem rather than a matter of hoping, is why I take monitoring seriously.',
        featured: true,
        order: 3
      },
      {
        title: 'The Pragmatic Programmer: 20th Anniversary Edition',
        author: 'David Thomas, Andrew Hunt',
        type: 'both',
        category: 'Software Engineering',
        status: 'completed',
        rating: 5,
        url: 'https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/',
        takeaway: 'Practical habits more than theory: fix the broken windows, keep investing in your knowledge, use tracer bullets, and keep systems decoupled.',
        featured: false,
        order: 4
      },
      {
        title: 'Staff Engineer: Leadership Beyond the Management Track',
        author: 'Will Larson',
        type: 'listened',
        category: 'Engineering Leadership',
        status: 'completed',
        rating: 5,
        url: 'https://staffeng.com/book',
        takeaway: 'About doing technical work beyond your own code: writing architecture RFCs people actually read, getting teams aligned, mentoring, and carrying initiatives that span quarters.',
        featured: false,
        order: 5
      },
      {
        title: 'Building Microservices: Designing Fine-Grained Systems',
        author: 'Sam Newman',
        type: 'read',
        category: 'System Design',
        status: 'completed',
        rating: 5,
        url: 'https://samnewman.io/books/building_microservices_2nd_edition/',
        takeaway: 'A sensible counterweight to microservice enthusiasm. I got the most out of the chapters on evolving a database (the strangler fig pattern), choreography versus orchestration, and where to draw tracing boundaries.',
        featured: false,
        order: 6
      }
    ];
    for (const b of initialBooks) {
      await db.insert(books).values({ ...b, createdAt: now, updatedAt: now });
    }
    console.log(`  ✅ Inserted ${initialBooks.length} technical books & audiobooks`);

    // 3e. DIY Workshop & Hardware Projects
    console.log('🛠️ Seeding workshop & DIY projects...');
    const initialBuilds = [
      {
        slug: 'alice-split-keyboard',
        title: 'Custom 65% Alice Ergonomic Mechanical Keyboard',
        badge: 'Completed / Daily Driver',
        timeframe: '3 weekends',
        categoryKey: 'keyboards',
        category: 'Hardware / Peripherals',
        icon: 'keyboard',
        summary: 'A mechanical keyboard built from scratch: custom-cut FR4 plates, hand-lubed switches, and QMK/VIA firmware.',
        image: '',
        video: '',
        highlights: JSON.stringify([
          'Angled Alice layout, chosen to keep my wrists from pronating during long coding sessions',
          'Gateron Oil King linears, hand-lubed with Krytox 205g0 and GPL 105',
          'Poured silicone dampener inside the anodized aluminum case to kill the hollow sound',
          'Runs on an RP2040 with custom layers, including Vim navigation on CapsLock'
        ]),
        bom: JSON.stringify([
          { item: 'Microcontroller', spec: 'Raspberry Pi RP2040 (Zero)' },
          { item: 'Switches', spec: 'Gateron Oil King Linears (55g actuation)' },
          { item: 'Keycaps', spec: 'PBT Dye-Sub Chalk Profile' },
          { item: 'Stabilizers', spec: 'TX AP Screw-in V4 Stabilizers' },
          { item: 'Plate & Foam', spec: 'Custom laser-cut FR4 + Poron Gasket Strips' }
        ]),
        tools: JSON.stringify(['Soldering Iron (TS100)', 'Krytox 205g0', 'Switch Opener', 'Multimeter', 'QMK CLI']),
        learnings: 'Getting the sound right came down to tolerance matching: switch housings, plate stiffness, and gasket compression all have to agree.',
        featured: true,
        order: 1
      },
      {
        slug: 'silent-homelab-cluster',
        title: 'Zero-Noise 3-Node Homelab Cluster & Private Cloud',
        badge: 'Hardware Active (99.9% Uptime)',
        timeframe: '2 weeks',
        categoryKey: 'homelab',
        category: 'Infrastructure / Homelab',
        icon: 'server',
        summary: 'A silent three-node mini server cluster in a custom 3D-printed rack. It runs K3s, a Tailscale mesh, and local LLM inference.',
        image: '',
        video: '',
        highlights: JSON.stringify([
          'Modular PETG rack I designed and printed, with cable management and a magnetic dust filter',
          'Noctua 5V fans on custom cooling channels keep SoC temperatures under 48C even at full multi-core load',
          'All-NVMe storage over UASP bridges, about 420 MB/s sustained sequential I/O',
          'ArgoCD handles GitOps deployments for local DNS, Home Assistant, WireGuard, and the container workloads'
        ]),
        bom: JSON.stringify([
          { item: 'Compute Nodes', spec: '3x Raspberry Pi 4B (8GB RAM each, 24GB total)' },
          { item: 'Storage', spec: '3x Kingston 1TB NVMe M.2 + Sabrent Aluminum Enclosures' },
          { item: 'Cooling', spec: '2x Noctua NF-A4x10 5V Low-Noise PWM Fans' },
          { item: 'Networking', spec: 'Netgear 5-Port Gigabit Managed Switch (VLAN configured)' },
          { item: 'Chassis', spec: 'Custom designed PETG 3D Printed Stack' }
        ]),
        tools: JSON.stringify(['Bambu Lab 3D Printer (PETG)', 'Crimping Tool (RJ45)', 'Digital Caliper', 'Ansible']),
        learnings: 'Drawing the ventilation ducts in CAD before printing kept hot air from recirculating between the stacked boards.',
        featured: true,
        order: 2
      },
      {
        slug: 'esp32-co2-sentry',
        title: 'ESP32 Micro-Climate & True NDIR CO2 Sentry',
        badge: 'Deployed in Studio',
        timeframe: '4 days',
        categoryKey: 'iot',
        category: 'IoT / Embedded',
        icon: 'cpu',
        summary: 'A low-power desk monitor that reads CO2 with a photoacoustic NDIR sensor and shows it on e-paper, so I can tell when the room needs air.',
        image: '',
        video: '',
        highlights: JSON.stringify([
          'Sensirion SCD40 measures CO2 in ppm, plus temperature and relative humidity',
          '2.9-inch black-and-white e-paper display with no backlight, still readable in direct sun',
          'The firmware sleeps and wakes every five minutes, which stretches a single 18650 cell to months',
          'Publishes telemetry over MQTT into Home Assistant and Grafana'
        ]),
        bom: JSON.stringify([
          { item: 'Processor', spec: 'ESP32-S3 Mini Module (Wi-Fi + BLE)' },
          { item: 'CO2 Sensor', spec: 'Sensirion SCD40 True NDIR Photoacoustic' },
          { item: 'Display', spec: 'Waveshare 2.9" SPI e-Paper Module' },
          { item: 'Power', spec: 'Panasonic 18650 3400mAh Li-ion + TP4056 USB-C' },
          { item: 'Case', spec: 'Handcrafted Solid Walnut & Frosted Smoked Acrylic' }
        ]),
        tools: JSON.stringify(['Soldering Station', 'ESP-IDF / PlatformIO', 'Oscilloscope', 'Laser Cutter']),
        learnings: 'CO2 above 1000 ppm measurably dulls my focus. Seeing the number on the desk is enough to make me open a window.',
        featured: true,
        order: 3
      },
      {
        slug: 'circadian-smart-lighting',
        title: 'Studio Bias Luminescence & Circadian Smart Lighting',
        badge: 'Active Daily',
        timeframe: '1 weekend',
        categoryKey: 'lighting',
        category: 'Smart Lighting / Firmware',
        icon: 'zap',
        summary: 'Addressable bias lighting with CRI 95+ LEDs and custom WLED firmware, with a color temperature that follows the sun through the day.',
        image: '',
        video: '',
        highlights: JSON.stringify([
          'CRI 95+ LEDs, easier on the eyes during late-night sessions',
          '45-degree aluminum channel with a frosted diffuser, so there are no visible hotspots',
          'Works locally with HomeKit and Home Assistant, with a rotary encoder for smooth physical dimming',
          'A MEMS microphone (INMP441) drives a sound-reactive mode for music'
        ]),
        bom: JSON.stringify([
          { item: 'LED Strip', spec: 'WS2812B 60 LED/m (High CRI 95+, 5V)' },
          { item: 'MCU', spec: 'ESP32-WROOM-32 with Logic Level Shifter (74AHCT125)' },
          { item: 'Power Supply', spec: 'Mean Well 5V 10A LRS-50 Switching PSU' },
          { item: 'Diffuser', spec: 'Black Anodized V-Slot Extrusion Channel (2m)' },
          { item: 'Audio Sensor', spec: 'INMP441 I2S Digital MEMS Microphone' }
        ]),
        tools: JSON.stringify(['Wire Strippers', 'Heat Gun', 'Multimeter', 'WLED Web Flasher']),
        learnings: 'The 3.3V ESP32 data line needs a 74AHCT125 level shifter to reach 5V, otherwise long wire runs flicker at high frequencies.',
        featured: false,
        order: 4
      }
    ];
    for (const b of initialBuilds) {
      await db.insert(workshopProjects).values({ ...b, createdAt: now, updatedAt: now });
    }
    console.log(`  ✅ Inserted ${initialBuilds.length} workshop projects`);

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
        details: 'Co-founded BoringRats and grew it to 1M+ active users. Built the real-time event ingestion pipelines, the analytics warehouse, and the MLOps workflows, along with the backend systems and infrastructure the product ran on. The company was acquired in November 2025; the acquirer is under NDA and my co-founder is available as a reference.',
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
        description: 'Co-founded BoringRats and scaled its infrastructure to 1M+ active users. Acquired in November 2025.',
        url: 'https://www.linkedin.com/in/swadhinbiswas/',
        story: 'I co-founded BoringRats and owned the backend and data infrastructure from the first monolith to a horizontally scaled system serving 1M+ active users.\n\n- Event-driven architecture on Kafka with idempotent consumers, so messages were neither lost nor processed twice\n- Real-time analytics pipeline (Airflow and Spark) feeding product decisions with sub-minute freshness\n- Read-heavy API layer tuned with Redis caching and connection pooling, holding p99 latency under 250ms\n- Zero-downtime deploys with canary releases, so shipping never interrupted users\n\nThe hard part was the growth curve. What worked at 10K users broke at 100K, and I spent months on capacity planning, backpressure, and database read-path optimization. Designing for ten times the load you have today stopped feeling like overkill.',
        outcome: '- 1M+ active users served on the platform\n- p99 API latency under 250ms at peak\n- 99.9%+ uptime through the growth phase\n- Infrastructure cost stayed flat while traffic grew 10x\n- The company was acquired in November 2025',
        order: 1,
      },
      {
        name: 'Startup acquired', slug: 'startup-acquired', icon: 'award', year: '2025',
        description: 'BoringRats was acquired in November 2025. The acquirer\'s name is under NDA, and my co-founder is available as a reference.',
        url: 'https://www.linkedin.com/in/swadhinbiswas/',
        story: 'BoringRats was acquired in November 2025 after several years of growth. The acquirer\'s name is under NDA, and my co-founder can act as a reference.\n\n- The product was bootstrapped with a small team, and I handled backend, data, and infrastructure\n- The technical foundation mattered in the acquisition: architecture that scaled, steady uptime, and product decisions backed by data\n- We kept shipping through due diligence and never missed a release\n\nWhat I took from it: buyers pay for reliability and steady engineering more than for how clever the code is.',
        outcome: '- The acquisition closed in November 2025\n- The team and product continued through the transition\n- The infrastructure serving 1M+ users was handed over cleanly',
        order: 2,
      },
      {
        name: 'Production ML systems', slug: 'production-ml-systems', icon: 'cpu', year: '2024',
        description: '3+ years building high-throughput data pipelines and production ML infrastructure.',
        url: 'https://github.com/swadhinbiswas',
        story: 'Three-plus years building high-throughput data pipelines and the production ML infrastructure that sits between raw data and product decisions.\n\n- Streaming pipelines (Kafka, Flink) processing millions of events a day\n- Batch orchestration (Airflow, dbt) keeping warehouse models fresh and tested\n- ML serving: feature stores, model registries, and low-latency inference endpoints\n- Monitoring and alerting with Prometheus and Grafana, with SLOs we actually page on',
        outcome: '- Data freshness for product analytics stayed under a minute\n- Warehouse models had automated test coverage\n- Inference endpoints held p99 latency under 100ms\n- Alerting caught issues before users noticed them',
        order: 3,
      },
      {
        name: 'Open source ecosystem', slug: 'open-source-ecosystem', icon: 'github', year: '2025',
        description: 'Building OpencodeHub, an open-source project aimed at making professional-grade developer tools available to anyone.',
        url: 'https://opencodehub.space',
        story: 'OpencodeHub is my open-source project: a set of developer tools meant to make professional-grade tooling available to anyone.\n\n- The gap I saw: powerful developer tools tend to be fragmented or locked behind paid platforms\n- I built the core tooling in the open from day one, using TypeScript and Node.js, with most of the attention on the CLI\n- The community side runs through issues, pull requests, and documentation written for people rather than for a spec\n\nThe repository is public and still under active development.',
        outcome: '- The repository is public and in active development\n- People engage through issues and contributions\n- Part of a longer goal: making developer tooling available outside closed platforms',
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
        label: "Users reached",
        value: "1M+",
        sub: "On Boringrats before acquisition",
        order: 0,
      },
      {
        label: "Acquisition",
        value: "2025",
        sub: "Boringrats, November 2025",
        order: 1,
      },
      {
        label: "Production work",
        value: "3+ yrs",
        sub: "Data pipelines and ML infrastructure",
        order: 2,
      },
      {
        label: "Open source",
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
        value: `Backend engineer and co-founder. I build high-throughput data pipelines and production ML systems.`
      },
      {
        key: 'story',
        value: "I build data pipelines and the MLOps layer around machine learning systems, mostly so raw data turns into something reliable enough to make decisions with. At Boringrats I was the data and backend engineer and a co-founder, and I built the infrastructure that carried the product to 1M+ active users before the company was acquired. These days I split my time between low-latency, cost-efficient data platforms and OpencodeHub, an open-source project for developer tooling. I'm working toward relocating to the EU (Germany, the Netherlands, or Austria)."
      },
      { key: 'currentFocus', value: siteConfig.bio.currentFocus || 'Data engineering, MLOps, AI systems, and open source.' },
      { key: 'currentlyBuilding', value: siteConfig.bio.currentlyBuilding || 'OpencodeHub, an open-source developer platform.' },
      { key: 'seeking', value: siteConfig.bio.seeking || 'Relocation to Germany, the Netherlands, or Austria.' },
      { key: 'availability', value: siteConfig.bio.availability || 'Open to mid-level data and backend roles' },
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
      startDate: "2022-04-01", // 4-year B.Sc. programme
      endDate: "2026-04-01", // Expected graduation
      details: "Coursework included data structures, algorithms, database systems, machine learning, and software engineering.",
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
      description: "First author. The paper proposes a combined denoising and domain-adaptation framework for self-supervised Bengali dialectal ASR, aimed at low-resource speech recognition across regional dialects.",
      order: 0,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(publications).values({
      title: "An Empirical Benchmark Dataset for Paillier-Based Privacy-Preserving REST API Gateways",
      venue: "Zenodo (DOI: 10.5281/zenodo.18655966)",
      url: "https://zenodo.org/records/18655966",
      date: "2026-02-16",
      description: "The homomorphic_request benchmark dataset for Paillier-based homomorphic encryption in privacy-preserving REST API gateways. It covers concurrency scaling, batch variation, homomorphic overhead, burst traffic, and fault injection, with per-request telemetry and a reproducible Go harness. Daffodil International University. DOI: 10.5281/zenodo.18655966",
      order: 1,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  ✅ Inserted publications`);

    // 11. Interests
    console.log('🎭 Seeding interests...');
    const interestsData = [
      { name: "Open Source", category: "Tech", icon: "github", description: "I contribute to backend and ML deployment tools." },
      { name: "Movies", category: "Hobby", icon: "film", description: "I like cinema and a good story." },
      { name: "Anime", category: "Hobby", icon: "tv", description: "I watch a lot of anime." },
      { name: "Tech Exploration", category: "Tech", icon: "rocket", description: "Trying out new tools and frameworks." },
      { name: "Food", category: "Hobby", icon: "utensils", description: "Biriyani, mostly." }
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
      { slug: 'data-engineering', label: 'Data Engineering', short: 'Pipelines, warehouses and streaming', description: 'Pipelines, warehouses, streaming, orchestration, and the analytics layer.', order: 1 },
      { slug: 'web', label: 'Web', short: 'Apps, platforms and APIs', description: 'Web applications, APIs, and real-time platforms.', order: 2 },
      { slug: 'cli-tools', label: 'CLI Tools', short: 'Terminal-first developer tools', description: 'Command-line tools and terminal-first utilities.', order: 3 },
      { slug: 'ai-ml', label: 'AI / ML', short: 'Models, MLOps and applied AI', description: 'Applied machine learning and MLOps infrastructure.', order: 4 },
      { slug: 'devops', label: 'DevOps & Cloud', short: 'Infrastructure, IaC and observability', description: 'Infrastructure as code, Kubernetes, CI/CD, monitoring, and cloud architecture.', order: 5 },
      { slug: 'open-source', label: 'Open Source', short: 'Public tools and ecosystems', description: 'Open source software and public tooling.', order: 6 },
      { slug: 'research', label: 'Research', short: 'Papers, benchmarks and prototypes', description: 'Research systems, benchmarks, and applied prototypes.', order: 7 },
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
      { question: 'What roles is Swadhin open to?', answer: 'Mid-level data engineering and backend engineering roles, focused on production data infrastructure, MLOps, and distributed systems.', order: 1 },
      { question: 'Is Swadhin available to relocate to the EU?', answer: 'Yes. He is looking to relocate to Germany, the Netherlands, or Austria, and is open to fully remote roles across the EU.', order: 2 },
      { question: 'What is the notice period?', answer: '30 days.', order: 3 },
      { question: 'Does Swadhin need visa sponsorship?', answer: 'Yes. Relocating to the EU would require visa sponsorship from the employer.', order: 4 },
    ];
    for (const f of faqsData) {
      await db.insert(faqs).values({ ...f, createdAt: now, updatedAt: now });
    }
    console.log(`  ✅ Inserted ${faqsData.length} FAQs`);

    // 16c. Languages
    console.log('🌍 Seeding languages...');
    const languagesData = [
      { name: 'English', level: 'fluent', note: 'Professional working proficiency (C1). It\'s the language I work in every day.', order: 1 },
      { name: 'Bengali', level: 'native', note: 'Native speaker.', order: 2 },
      { name: 'German', level: 'learning', note: 'Currently learning, for the move to Germany.', order: 3 },
      { name: 'Hindi', level: 'working', note: 'Conversational speaking and understanding.', order: 4 },
    ];
    for (const l of languagesData) {
      await db.insert(languages).values({ ...l, createdAt: now, updatedAt: now });
    }
    console.log(`  ✅ Inserted ${languagesData.length} languages`);

    // 17. Site text (DB-driven copy — no hardcoded strings in components)
    console.log('✍️ Seeding site text...');
    const siteText = [
      { key: 'sidebar_tagline', value: 'Data engineering, backend systems, and the occasional hand-built website.' },
      { key: 'footer_tagline', value: 'Built with Astro, deployed on Vercel, carbon-aware.' },
      { key: 'contact_blurb', value: "Email is the best way to reach me. I'm interested in backend systems, data engineering, AI product work, research tooling, and technical collaborations that are worth the time." },
      { key: 'uses_philosophy', value: 'I pick tools that fit the job rather than whatever is trending, and I\'d rather run something simple and reliable than something new. The best code is usually the code you don\'t have to write.\n\nMy setup leans on keyboard-driven workflows and keeps things reproducible.' },
      { key: 'notice_period', value: '30 days' },
      { key: 'work_authorization', value: 'Open to relocation; requires work visa sponsorship in the EU' },
      { key: 'relocation_targets', value: 'Germany · Netherlands · Austria · Remote EU' },
      { key: 'english_level', value: 'English (professional working proficiency, C1)' },
      { key: 'meeting_url', value: 'https://cal.com/swadhinbiswas' },
      { key: 'availability_hours', value: 'Available 8am to 12pm CET daily for calls' },
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
