# Quick Start Guide - Portfolio Setup

## Prerequisites
- [Bun](https://bun.sh/) installed (v1.0.0 or higher)
- Node.js 18+ (if not using Bun)

---

## 1. Clone and Install

```bash
# Install dependencies
bun install
```

---

## 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.example .env.local
```

### Minimum Required Variables (Local Development)

```env
# Site Configuration
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_SITE_NAME="Swadhin Biswas"
PUBLIC_SITE_DESCRIPTION="Backend Engineer | AI Systems Architect | Data Science Enthusiast"

# Personal Information
PUBLIC_EMAIL=swadhinbiswas.cse@gmail.com
PUBLIC_GITHUB=swadhinbiswas
PUBLIC_LINKEDIN=swadh1n
PUBLIC_TWITTER=swadh1n
PUBLIC_LOCATION="Dhaka, Bangladesh"
PUBLIC_TIMEZONE="Asia/Dhaka"

# Database (Local SQLite - No external service needed!)
TURSO_DATABASE_URL="file:local.db"
TURSO_AUTH_TOKEN=""

# Admin Credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-this-password"
```

---

## 3. Database Setup

```bash
# Generate database schema
bun run db:generate

# Push schema to local database
TURSO_DATABASE_URL="file:local.db" bun run db:push

# Seed database with initial data
TURSO_DATABASE_URL="file:local.db" bun run src/db/seed.ts
```

---

## 4. Run Development Server

```bash
bun run dev
```

The site will be available at: **http://localhost:4321**

---

## 5. Access Admin Panel

Navigate to: **http://localhost:4321/cat**

- **Username:** `admin`
- **Password:** (the value you set in `.env.local`)

---

## 6. Build for Production

```bash
bun run build
```

Output will be in the `dist/` directory.

---

## 7. Preview Production Build

```bash
bun run preview
```

---

## Common Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run db:generate` | Generate database migrations |
| `bun run db:push` | Push schema to database |
| `bun run db:studio` | Open database GUI (Drizzle Studio) |
| `bun run src/db/seed.ts` | Seed database with initial data |

---

## Troubleshooting

### Database Not Found Error
```bash
# Make sure you've pushed the schema
TURSO_DATABASE_URL="file:local.db" bun run db:push
```

### Missing Environment Variables
```bash
# Check your .env.local file exists and has required variables
cat .env.local
```

### Port Already in Use
```bash
# Kill the process using port 4321
lsof -ti:4321 | xargs kill -9
```

### Build Fails
```bash
# Clean and reinstall
rm -rf node_modules bun.lockb dist/
bun install
bun run build
```

---

## Project Structure

```
portfolio/
├── src/
│   ├── components/       # Astro/React components
│   ├── content/          # MDX content collections
│   ├── db/               # Database schema and seed
│   ├── layouts/          # Base layouts
│   ├── lib/              # Utilities and helpers
│   ├── pages/            # Routes and API endpoints
│   └── config/           # Site configuration
├── public/               # Static assets
├── .env.example          # Environment variables template
├── .env.local            # Your environment variables (gitignored)
├── package.json          # Dependencies
└── drizzle.config.ts     # Database configuration
```

---

## Admin Panel Features

### Content Management
- ✅ Site Settings
- ✅ Social Links
- ✅ Navigation Items
- ✅ Experiences
- ✅ Projects (Add/Edit/Delete)
- ✅ Skills
- ✅ Achievements
- ✅ Bio Content
- ✅ Education
- ✅ Publications
- ✅ Interests
- ✅ Support Options

### Project Management
1. Navigate to `/cat/projects`
2. Click "Add Project"
3. Fill in project details:
   - Name (required)
   - Description (required)
   - Content (Markdown supported)
   - URL (required)
   - GitHub URL (optional)
   - Image URL (optional)
   - Tags (comma-separated)
   - Featured (checkbox)
   - Stars (number)
   - Order (for sorting)
4. Click "Save"

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

```env
# Use Turso production URL
TURSO_DATABASE_URL="libsql://your-db.turso.io"
TURSO_AUTH_TOKEN="your-token"

# Update site URL
PUBLIC_SITE_URL="https://your-domain.com"
```

---

## Support

For issues:
1. Check `CHANGES.md` for recent updates
2. Review `.env.example` for environment variables
3. Inspect browser console for errors
4. Check build logs for compilation errors

---

**Happy Coding! 🚀**
