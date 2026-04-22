// This file is obsolete.
// All configuration is now exclusively pushed and pulled directly from the database
// via the admin settings dashboard. 
// See `src/lib/config.ts` (getDynamicConfig) for the database loader logic.

export const siteConfig = {
  deprecated: "All settings are now managed in the database via getDynamicConfig()."
};

export default siteConfig;
