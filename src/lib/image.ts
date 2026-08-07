// Image optimization via Vercel's image optimizer (`/_vercel/image`).
// Returns the optimized CDN URL; falls back to the original URL in dev or
// on non-Vercel hosts so the site never breaks.

export function opt(url: string | null | undefined, width = 800, quality = 80): string {
  if (!url) return "";
  if (/^data:/i.test(url)) return url;
  // Local assets are already optimized at build; only proxy remote images
  if (url.startsWith("/") || url.startsWith("data:")) return url;
  const vercel = import.meta.env.PROD;
  if (!vercel) return url;
  const params = new URLSearchParams({
    url,
    w: String(width),
    q: String(quality),
  });
  return `/_vercel/image?${params.toString()}`;
}
