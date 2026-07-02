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
      if (['Python', 'JavaScript', 'TypeScript', 'Rust', 'Mojo', 'Go'].includes(skillName)) {
        category = 'language';
      } else if (['Django', 'FastAPI', 'React', 'Next.js', 'Node.js', 'Express'].includes(skillName)) {
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
    console.log(`  ✅ Inserted publications`);

    // 11. Interests
    console.log('🎭 Seeding interests...');
    const interestsData = [
      { name: "Open Source", category: "Tech", icon: "🌐", description: "Active contributor to backend systems and ML deployment tools." },
      { name: "Movies", category: "Hobby", icon: "🎬", description: " enjoying cinema and storytelling." },
      { name: "Anime", category: "Hobby", icon: "🎌", description: " Avid anime watcher." },
      { name: "Tech Exploration", category: "Tech", icon: "🚀", description: "Exploring new technologies and frameworks." },
      { name: "Foodi", category: "Hobby", icon: "🍔", description: "A pure biriyani lover." }
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

    console.log('\n✨ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
