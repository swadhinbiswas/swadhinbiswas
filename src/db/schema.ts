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
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Projects
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  content: text('content'), // Detailed Markdown content
  url: text('url').notNull(),
  github: text('github'),
  image: text('image'),
  tags: text('tags').notNull().default('[]'), // JSON array stored as text
  featured: integer('featured', { mode: 'boolean' }).default(false),
  status: text('status').default('Active'), // Active, Archived, etc.
  projectDate: text('project_date'), // Manual date override
  stars: integer('stars').default(0),
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Blog Posts
export const posts = sqliteTable('posts', {
  slug: text('slug').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  content: text('content').notNull(), // Markdown content
  publishedAt: integer('published_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  tags: text('tags').default('[]'), // JSON array
  draft: integer('draft', { mode: 'boolean' }).default(false),
});

// Achievements
export const achievements = sqliteTable('achievements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  description: text('description').notNull(),
  url: text('url'), // Optional link to certificate/proof
  image: text('image'), // Optional preview image
  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Skills
export const skills = sqliteTable('skills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').default('general'), // 'language' | 'framework' | 'tool' | 'general'
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
      qrCode: text('qr_code'), // Storage URL  order: integer('order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});
export type SupportOption = typeof supportOptions.$inferSelect;
export type NewSupportOption = typeof supportOptions.$inferInsert;

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

export type ApiCache = typeof apiCache.$inferSelect;
export type NewApiCache = typeof apiCache.$inferInsert;
