// Image URL passthrough.
// Remote images (gravatar, GitHub raw, etc.) are loaded directly from their
// origin — no /_vercel/image proxying. The optimizer 400s on hosts that
// aren't allowlisted and mangles animated GIFs, so direct URLs are the
// reliable path for admin-entered content.

export function opt(url: string | null | undefined, _width = 800, _quality = 80): string {
  if (!url) return "";
  return url;
}
