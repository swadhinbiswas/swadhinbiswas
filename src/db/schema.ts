import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Site Settings (key-value store for basic settings)
export const siteSettings = sqliteTable('site_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Social Links
export const socialLinks = sqliteTable('social_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  icon: text('icon').notNull(),
  footer: integer('footer', { mode: 'boolean' }).default(false),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Navigation Items
export const navigationItems = sqliteTable('navigation_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  href: text('href').notNull(),
  external: integer('external', { mode: 'boolean' }).default(false),
  location: text('location').notNull().default('header'), // 'header' | 'menu' | 'both'
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Experiences
export const experiences = sqliteTable('experiences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  company: text('company').notNull(),
  role: text('role').notNull(),
  url: text('url').notNull(),
  companyDescription: text('company_description'),
  logoUrl: text('logo_url'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  details: text('details'),
  responsibilities: text('responsibilities'),
  learnings: text('learnings'),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Projects
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // URL-friendly slug
  description: text('description').notNull(),
  content: text('content'), // Detailed Markdown content
  url: text('url').notNull(),
  github: text('github'),
  image: text('image'),
  tags: text('tags').notNull().default('[]'), // JSON array stored as text
  category: text('category').default('data-engineering'), // 'data-engineering' | 'web' | 'cli-tools' | 'ai-ml' | 'devops' | 'open-source' | 'research'
  featured: integer('featured', { mode: 'boolean' }).default(false),
  status: text('status').default('Active'), // Active, Archived, Planning, In Development
  projectDate: text('project_date'), // Manual date override
  stars: integer('stars').default(0),
  order: integer('order').default(0),
  // Enhanced fields for professional project pages
  techStack: text('tech_stack').default('[]'), // JSON array of technologies
  demoUrl: text('demo_url'), // Live demo URL (separate from main url)
  documentation: text('documentation'), // Documentation URL
  metrics: text('metrics').default('{}'), // JSON object for stats { users: "10K+", uptime: "99.9%" }
  gallery: text('gallery').default('[]'), // JSON array of image URLs
  teamSize: integer('team_size'),
  duration: text('duration'), // e.g., "6 months"
  role: text('role'), // e.g., "Full Stack Developer"
  challenges: text('challenges'), // Markdown: key challenges faced
  outcomes: text('outcomes'), // Markdown: project outcomes/results
  lessonsLearned: text('lessons_learned'), // Markdown: lessons learned
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Blog Posts
export const posts = sqliteTable('posts', {
  slug: text('slug').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  content: text('content').notNull(), // Markdown content (used when no external_url)
  externalUrl: text('external_url'), // Optional link to the article (blog.swadhin.cv, Medium, etc.)
  publishedAt: integer('published_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  tags: text('tags').default('[]'), // JSON array
  draft: integer('draft', { mode: 'boolean' }).default(false),
});

// Achievements
export const achievements = sqliteTable('achievements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().default('').unique(), // URL-friendly slug
  icon: text('icon').notNull(), // Icon name (strokeIcon map) — not emoji
  description: text('description').notNull(),
  url: text('url'), // Optional link to certificate/proof
  image: text('image'), // Optional preview image
  story: text('story'), // Markdown: how it was achieved
  outcome: text('outcome'), // Markdown: measurable results
  year: text('year'), // e.g., "2025"
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Skills
export const skills = sqliteTable('skills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').default('general'), // 'language' | 'framework' | 'tool' | 'general'
  description: text('description'), // Where this skill was used
  usedIn: text('used_in'), // JSON array of project names where this skill was used
  tier: text('tier').default('core'), // 'core' | 'working'
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Bio Content
export const bioContent = sqliteTable('bio_content', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(), // 'short' | 'long' | 'quote' | 'funFact'
  value: text('value').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// SEO Settings
export const seoSettings = sqliteTable('seo_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(), // Can be JSON for complex values like keywords array
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Admin Sessions (for authentication)
export const adminSessions = sqliteTable('admin_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionToken: text('session_token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Clicker Game Global Counter
export const clicks = sqliteTable('clicks', {
  id: text('id').primaryKey(),
  count: integer('count').default(0),
});

// Type exports for TypeScript
export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;

export type SocialLink = typeof socialLinks.$inferSelect;
export type NewSocialLink = typeof socialLinks.$inferInsert;

export type NavigationItem = typeof navigationItems.$inferSelect;
export type NewNavigationItem = typeof navigationItems.$inferInsert;

export type Experience = typeof experiences.$inferSelect;
export type NewExperience = typeof experiences.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;

export type BioContent = typeof bioContent.$inferSelect;
export type NewBioContent = typeof bioContent.$inferInsert;

export type SeoSetting = typeof seoSettings.$inferSelect;
export type NewSeoSetting = typeof seoSettings.$inferInsert;

export type AdminSession = typeof adminSessions.$inferSelect;
export type NewAdminSession = typeof adminSessions.$inferInsert;

export type Click = typeof clicks.$inferSelect;
export type NewClick = typeof clicks.$inferInsert;
// Education
export const education = sqliteTable('education', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  institution: text('institution').notNull(),
  degree: text('degree').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  details: text('details'),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Publications
export const publications = sqliteTable('publications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  url: text('url'),
  venue: text('venue'), // e.g., arXiv, IEEE, Conference Name
  date: text('date').notNull(),
  description: text('description'), // Abstract or summary
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Interests
export const interests = sqliteTable('interests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').default('General'), // e.g., Tech, Hobbies
  description: text('description'),
  icon: text('icon'), // Emoji or icon name
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Page Views (Singleton)
export const pageViews = sqliteTable('page_views', {
  id: integer('id').primaryKey(), // Singleton: always 1
  count: integer('count').default(0),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Support Options (Dynamic)
export const supportOptions = sqliteTable('support_options', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon').notNull(), // Emoji or ID or raw SVG
  type: text('type').notNull().default('link'), // 'link' | 'copy' | 'qr'
  value: text('value').notNull(), // URL or Wallet Address
  qrCode: text('qr_code'), // Storage URL
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});
export type SupportOption = typeof supportOptions.$inferSelect;
export type NewSupportOption = typeof supportOptions.$inferInsert;

// Testimonials
export const testimonials = sqliteTable('testimonials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quote: text('quote').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Certifications (recruiter-friendly proof of expertise)
export const certifications = sqliteTable('certifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  issuer: text('issuer').notNull(),
  year: text('year'),
  url: text('url'), // Credential / verification link
  credentialId: text('credential_id'),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// FAQs (recruiter questions — powers FAQPage rich results)
export const faqs = sqliteTable('faqs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Languages (spoken + learning — multilingual profile for EU recruiters)
export const languages = sqliteTable('languages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  level: text('level').notNull().default('learning'), // 'native' | 'fluent' | 'working' | 'learning'
  note: text('note'),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Hero Metrics
export const heroMetrics = sqliteTable('hero_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  value: text('value').notNull(),
  sub: text('sub').notNull(),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// API Cache (for rate limiting external APIs)
export const apiCache = sqliteTable('api_cache', {
  key: text('key').primaryKey(), // e.g., 'latest_commit'
  data: text('data').notNull(), // JSON string
  updatedAt: integer('updated_at').notNull(), // Timestamp in ms
});

export type Education = typeof education.$inferSelect;
export type NewEducation = typeof education.$inferInsert;

export type Publication = typeof publications.$inferSelect;
export type NewPublication = typeof publications.$inferInsert;

export type Interest = typeof interests.$inferSelect;
export type NewInterest = typeof interests.$inferInsert;

export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;

export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;

export type HeroMetric = typeof heroMetrics.$inferSelect;
export type NewHeroMetric = typeof heroMetrics.$inferInsert;

export type ApiCache = typeof apiCache.$inferSelect;
export type NewApiCache = typeof apiCache.$inferInsert;

// Project Categories (taxonomy driven from DB — no hardcoded lists)
export const projectCategories = sqliteTable('project_categories', {
  slug: text('slug').primaryKey(),
  label: text('label').notNull(),
  short: text('short').notNull().default(''),
  description: text('description').notNull().default(''),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export type ProjectCategory = typeof projectCategories.$inferSelect;
export type NewProjectCategory = typeof projectCategories.$inferInsert;

// Uses / toolbox (driven from DB)
export const uses = sqliteTable('uses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category').notNull().default('General'),
  item: text('item').notNull(),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export type Use = typeof uses.$inferSelect;
export type NewUse = typeof uses.$inferInsert;

// Gallery Photos & Media
export const galleryPhotos = sqliteTable('gallery_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  thumb: text('thumb'),
  mediaType: text('media_type').default('image'), // 'image' | 'video'
  category: text('category').default('night'), // 'night' | 'nature' | 'street' | 'travel' | 'macro'
  categoryLabel: text('category_label').default('Night Photography'),
  location: text('location').default('Bangladesh'),
  year: text('year').default('2026'),
  camera: text('camera').default('GCam / LMC 8.4'),
  lens: text('lens').default('Prime Wide'),
  aperture: text('aperture').default('ƒ/1.8'),
  shutter: text('shutter').default('1/120s'),
  iso: text('iso').default('ISO 200'),
  focal: text('focal').default('26mm'),
  story: text('story'),
  aspect: text('aspect').default('wide'), // 'wide' | 'tall' | 'square'
  featured: integer('featured', { mode: 'boolean' }).default(false),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type NewGalleryPhoto = typeof galleryPhotos.$inferInsert;

// Books & Technical Reading / Audiobooks
export const books = sqliteTable('books', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  author: text('author').notNull(),
  type: text('type').default('read'), // 'read' | 'listened' | 'both'
  category: text('category').default('Distributed Systems'),
  status: text('status').default('completed'), // 'completed' | 'reading' | 'listening' | 'recommended'
  rating: integer('rating').default(5),
  url: text('url'),
  cover: text('cover'),
  takeaway: text('takeaway'),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;

// DIY Workshop & Hardware Projects
export const workshopProjects = sqliteTable('workshop_projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  badge: text('badge').default('Completed'),
  timeframe: text('timeframe').default('1 weekend'),
  categoryKey: text('category_key').default('keyboards'), // 'keyboards', 'homelab', 'iot', 'lighting', 'general'
  category: text('category').default('Hardware / Peripherals'),
  icon: text('icon').default('cpu'), // 'keyboard', 'server', 'cpu', 'zap', 'tool'
  summary: text('summary'),
  image: text('image'), // Image URL
  video: text('video'), // Video URL (MP4 / CDN)
  highlights: text('highlights'), // JSON string array
  bom: text('bom'), // JSON string array of { item, spec }
  tools: text('tools'), // JSON string array
  learnings: text('learnings'),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export type WorkshopProject = typeof workshopProjects.$inferSelect;
export type NewWorkshopProject = typeof workshopProjects.$inferInsert;



