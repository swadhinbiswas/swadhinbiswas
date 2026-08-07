// Shared branded OG image (SVG) builder — used by projects, achievements, posts.
// Google supports SVG og:image. Twitter/LinkedIn need raster → those pages keep
// a PNG fallback for twitter:image.

export interface OgOptions {
  kicker: string;          // e.g. "Data Engineering", "Achievement", "Blog"
  title: string;           // main headline (truncated inside)
  description: string;     // subtitle line
  meta?: string[];         // small meta chips like "★ 114 stars"
  tags?: string[];         // pill tags
  footer?: string;         // bottom-left footer line (defaults to site tag)
}

const esc = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function ogSvg(o: OgOptions): string {
  const title = esc(o.title).slice(0, 40);
  const description = esc(o.description).slice(0, 110);
  const kicker = esc(o.kicker).slice(0, 30);
  const footer = esc(o.footer || "Swadhin Biswas · Data / Backend Engineer · swadhin.cv");
  const meta = (o.meta || []).slice(0, 4).map(esc);
  const tags = (o.tags || []).slice(0, 3).map(esc);

  const metaLine = meta.map((m, i) => {
    if (i === 0) return `<text x="68" y="420" font-family="JetBrains Mono, monospace" font-size="18" fill="#A1A1AA">${m}</text>`;
    const prevWidth = i === 1 ? 60 : 220;
    return `<text x="${68 + prevWidth + i * 90}" y="420" font-family="JetBrains Mono, monospace" font-size="18" fill="#52525B">·</text><text x="${98 + prevWidth + i * 90}" y="420" font-family="JetBrains Mono, monospace" font-size="18" fill="#A1A1AA">${m}</text>`;
  }).join("");

  const tagHtml = tags
    .map((t, i) =>
      `<rect x="${68 + i * 176}" y="290" width="160" height="30" rx="15" fill="#1A1A1A" stroke="#3F3F46"/>
       <text x="${68 + i * 176 + 80}" y="309" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="14" fill="#A1A1AA">${t.slice(0, 18)}</text>`
    )
    .join("");

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0A0A0A"/>
      <stop offset="100%" stop-color="#141414"/>
    </linearGradient>
    <linearGradient id="title" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="60%" stop-color="#D4D4D8"/>
      <stop offset="100%" stop-color="#A1A1AA"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#52525B" stop-opacity="0.08"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="24" y="24" width="1152" height="582" rx="20" fill="none" stroke="url(#ring)" stroke-width="2"/>

  <rect x="68" y="64" width="140" height="36" rx="18" fill="#141414" stroke="#3F3F46"/>
  <text x="138" y="87" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="15" fill="#D4D4D8">${kicker}</text>

  <text x="68" y="180" font-family="Inter, system-ui, sans-serif" font-size="64" font-weight="800" fill="url(#title)" letter-spacing="-1">${title}</text>
  <text x="70" y="240" font-family="Inter, system-ui, sans-serif" font-size="28" fill="#A1A1AA">${description}</text>

  ${tagHtml}

  <rect x="68" y="356" width="1064" height="1" fill="#27272A"/>

  ${metaLine}

  <text x="68" y="540" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="600" fill="#F4F4F5">Swadhin Biswas</text>
  <text x="68" y="572" font-family="JetBrains Mono, monospace" font-size="16" fill="#52525B">${footer}</text>
</svg>`;
}
