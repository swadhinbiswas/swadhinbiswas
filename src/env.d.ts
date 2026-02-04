/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    isAdmin?: boolean;
  }
}

interface ImportMetaEnv {
  readonly TURSO_DATABASE_URL: string;
  readonly TURSO_AUTH_TOKEN: string;
  readonly ADMIN_USERNAME: string;
  readonly ADMIN_PASSWORD: string;
  readonly PUBLIC_SITE_NAME: string;
  readonly PUBLIC_SITE_DESCRIPTION: string;
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_EMAIL: string;
  readonly PUBLIC_LOCATION: string;
  readonly PUBLIC_TIMEZONE: string;
  readonly PUBLIC_GITHUB: string;
  readonly PUBLIC_LINKEDIN: string;
  readonly PUBLIC_TWITTER: string;
  readonly PUBLIC_KAGGLE: string;
  readonly PUBLIC_BLUESKY: string;
  readonly PUBLIC_ORCID: string;
  readonly PUBLIC_YOUTUBE: string;
  readonly PUBLIC_GA_ID: string;
  readonly GITHUB_TOKEN: string;
  readonly R2_ACCOUNT_ID: string;
  readonly R2_ACCESS_KEY_ID: string;
  readonly R2_SECRET_ACCESS_KEY: string;
  readonly R2_BUCKET_NAME: string;
  readonly R2_PUBLIC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
