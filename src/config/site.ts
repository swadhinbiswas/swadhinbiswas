export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
  footer?: boolean;
}

export interface Experience {
  company: string;
  role: string;
  url: string;
  logoUrl: string;
  startDate: string;
  endDate?: string;
  details?: string;
  companyDescription?: string;
}

export interface Project {
  name: string;
  description: string;
  url: string;
  github?: string;
  image?: string;
  tags: string[];
  featured?: boolean;
  stars?: number;
}

export interface Achievement {
  name: string;
  icon: string;
  description: string;
  image?: string;
}

export const siteConfig = {
  name: import.meta.env.PUBLIC_SITE_NAME || "Swadhin Biswas",
  description: import.meta.env.PUBLIC_SITE_DESCRIPTION || "Backend Engineer | AI Systems Architect | Data Science Enthusiast",
  url: import.meta.env.PUBLIC_SITE_URL || "https://swadhin.cv/",
  author: "Swadhin Biswas",
  email: import.meta.env.PUBLIC_EMAIL || "swadhinbiswas.cse@gmail.com",
  location: import.meta.env.PUBLIC_LOCATION || "Dhaka, Bangladesh",
  timezone: import.meta.env.PUBLIC_TIMEZONE || "Asia/Dhaka",

  seo: {
    author: "Swadhin Biswas",
    title: "Backend Engineer & AI Systems Architect",
    keywords: [
      "Backend Developer",
      "AI Systems Architect",
      "Data Science",
      "Python Developer",
      "Machine Learning Engineer",
      "Django Developer",
      "FastAPI Developer",
      "Full Stack Developer",
      "Software Engineer",
      "Dhaka Bangladesh",
      "Swadhin Biswas",
    ],
    worksFor: {
      name: "BoringRats",
      url: "https://boringrats.dev/"
    },
    location: {
      city: "Dhaka",
      country: "Bangladesh"
    }
  },

  links: {
    github: `https://github.com/${import.meta.env.PUBLIC_GITHUB || "swadhinbiswas"}`,
    linkedin: `https://linkedin.com/in/${import.meta.env.PUBLIC_LINKEDIN || "swadh1n"}`,
    twitter: `https://twitter.com/${import.meta.env.PUBLIC_TWITTER || "swadh1n"}`,
    kaggle: `https://kaggle.com/${import.meta.env.PUBLIC_KAGGLE || "swadhinbiswas"}`,
    bluesky: `https://bsky.app/profile/${import.meta.env.PUBLIC_BLUESKY || "swadhin.cv"}`,
    orcid: `https://orcid.org/${import.meta.env.PUBLIC_ORCID || "0009-0005-2980-6651"}`,
    youtube: "https://www.youtube.com/@lostinsyntax",
    email: `mailto:${import.meta.env.PUBLIC_EMAIL || "swadhinbiswas.cse@gmail.com"}`,
    scholar: "https://scholar.google.com/citations?hl=en&user=xHqlwTAAAAAJ",
    notion: "https://thephonex.notion.site/Notes-2ad8fd44dc51802fbd38cd337776960d",
  },

  navItems: [
    { label: "Projects", href: "/projects" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ] as NavItem[],

  navMenuItems: [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Brainstorm", href: "https://thephonex.notion.site/Notes-2ad8fd44dc51802fbd38cd337776960d", external: true },
  ] as NavItem[],

  socials: [
    { name: "GitHub", url: `https://github.com/${import.meta.env.PUBLIC_GITHUB || "swadhinbiswas"}`, icon: "github", footer: true },
    { name: "LinkedIn", url: `https://linkedin.com/in/${import.meta.env.PUBLIC_LINKEDIN || "swadh1n"}`, icon: "linkedin", footer: true },
    { name: "Twitter", url: `https://twitter.com/${import.meta.env.PUBLIC_TWITTER || "swadh1n"}`, icon: "twitter", footer: true },
    { name: "Kaggle", url: `https://kaggle.com/${import.meta.env.PUBLIC_KAGGLE || "swadhinbiswas"}`, icon: "kaggle", footer: false },
    { name: "Bluesky", url: `https://bsky.app/profile/${import.meta.env.PUBLIC_BLUESKY || "swadhin.cv"}`, icon: "bluesky", footer: false },
    { name: "YouTube", url: "https://www.youtube.com/@lostinsyntax", icon: "youtube", footer: true },
  ] as SocialLink[],

  experience: [
    {
      company: "BoringRats",
      role: "Backend Engineer",
      url: "https://boringrats.dev/",
      logoUrl: "https://raw.githubusercontent.com/BoringRats/.github/refs/heads/main/profile/boringrats.png",
      startDate: "2023-01-01",
      details: "Building scalable backend systems and AI solutions."
    },
    {
      company: "Freelance",
      role: "Full Stack Developer",
      url: "https://swadhin.cv/",
      logoUrl: "https://avatars.githubusercontent.com/u/13241788?v=4",
      startDate: "2021-01-01",
      endDate: "2022-12-31",
      details: "Worked on various web development projects for clients."
    },
  ] as Experience[],

  featuredProjects: [
    {
      name: "Live Attendance with Anti-Cheat",
      description: "Secure face login system using Python (face detection) and React (frontend). Prevents photo/video spoofing with anti-spoofing deep learning models.",
      url: "https://github.com/swadhinbiswas/liveattendence_with_anti_cheat",
      github: "https://github.com/swadhinbiswas/liveattendence_with_anti_cheat",
      tags: ["face-recognition", "anti-spoofing", "deep-learning", "react", "python"],
      featured: true,
      stars: 7
    },
    {
      name: "AIBOT",
      description: "An advanced, versatile chatbot enhancing user interactions and automation on Telegram.",
      url: "https://github.com/swadhinbiswas/AIBOT",
      github: "https://github.com/swadhinbiswas/AIBOT",
      tags: ["chatbot", "telegram", "automation", "ai"],
      featured: true,
      stars: 20
    },
  ] as Project[],

  achievements: [
    { name: "YOLO", icon: "🎯", description: "Merged a pull request without review" },
    { name: "Starstruck", icon: "⭐", description: "Created a repository that has 16 stars" },
    { name: "Quickdraw", icon: "⚡", description: "Closed an issue or pull request within 5 minutes" },
    { name: "Pull Shark", icon: "🦈", description: "Opened 2 pull requests that have been merged" },
  ] as Achievement[],

  skills: [
    "Python", "JavaScript", "TypeScript", "Rust", "Mojo",
    "Django", "FastAPI", "React", "Next.js",
    "Docker", "Kubernetes", "PostgreSQL", "Redis", "MongoDB",
    "Machine Learning", "Deep Learning", "Neural Networks",
    "Data Analysis", "DevOps", "Cybersecurity"
  ],

  bio: {
    short: "Backend Engineer & AI Systems Architect based in Dhaka, Bangladesh.",
    long: "I'm currently working as a Backend Engineer @ BoringRats. I've built scalable backend systems and AI solutions. Currently building AI that helps people articulate their ideas and share them at scale.",
    quote: "Move fast, break things, and optimize later.",
    funFact: "I believe every problem has a solution; you need to find the right algorithm!"
  }
};

export default siteConfig;
