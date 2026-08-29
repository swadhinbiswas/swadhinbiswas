import { db, galleryPhotos } from "../db";
import { asc } from "drizzle-orm";

export interface PhotoExif {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  focal?: string;
}

export interface PhotoItem {
  id: string;
  slug?: string;
  title: string;
  url: string;
  thumb?: string;
  mediaType?: "image" | "video";
  category?: "street" | "architecture" | "nature" | "night" | "travel" | "macro" | "video" | string;
  categoryLabel?: string;
  location?: string;
  year?: string;
  story?: string;
  exif?: PhotoExif;
  aspect?: "square" | "wide" | "tall";
  featured?: boolean;
  order?: number;
}

export const PHOTOGRAPHY_CDN_BASE = "https://cdn.swadhin.cv/photography/";

export const defaultPhotosList: PhotoItem[] = [
  {
    id: "photo-1",
    slug: "padma-river",
    title: "The Mighty Padma River",
    url: `${PHOTOGRAPHY_CDN_BASE}Paddma.jpg`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}Paddma.jpg`,
    mediaType: "image",
    category: "nature",
    categoryLabel: "Nature & Waters",
    location: "Padma River, Bangladesh",
    year: "2026",
    camera: "Wide Landscape Sensor",
    lens: "24mm Prime Equiv",
    story: "The vast expanse, horizon, and quiet water of the historic Padma River under daylight.",
    exif: {
      camera: "Wide Landscape Sensor",
      lens: "24mm Prime Equiv",
      aperture: "ƒ/2.8",
      shutter: "1/1000s",
      iso: "ISO 64",
      focal: "24mm"
    },
    aspect: "wide",
    featured: true,
    order: 1
  },
  {
    id: "photo-2",
    slug: "magical-night-twilight",
    title: "Magical Night Twilight",
    url: `${PHOTOGRAPHY_CDN_BASE}${encodeURIComponent("20240803_180241_🌆Magical Night by Riyan.jpg")}`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}${encodeURIComponent("20240803_180241_🌆Magical Night by Riyan.jpg")}`,
    mediaType: "image",
    category: "night",
    categoryLabel: "Night & Twilight",
    location: "Dusk Horizon",
    year: "2024",
    camera: "Magical Night (Riyan)",
    lens: "Custom Low-Light Tone Curve",
    story: "Stunning purple and gold twilight gradients across the evening sky.",
    exif: {
      camera: "Magical Night (Riyan)",
      lens: "Custom Tone Curve",
      aperture: "ƒ/1.8",
      shutter: "1/20s",
      iso: "ISO 400",
      focal: "26mm"
    },
    aspect: "tall",
    featured: true,
    order: 2
  },
  {
    id: "photo-3",
    slug: "magical-night-deep-glow",
    title: "Magical Night Deep Glow",
    url: `${PHOTOGRAPHY_CDN_BASE}${encodeURIComponent("20240803_180822_🌆Magical Night by Riyan.jpg")}`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}${encodeURIComponent("20240803_180822_🌆Magical Night by Riyan.jpg")}`,
    mediaType: "image",
    category: "night",
    categoryLabel: "Night & Twilight",
    location: "Evening Horizon",
    year: "2024",
    camera: "Magical Night (Riyan)",
    lens: "Atmospheric Lens",
    story: "Deep ambient twilight glow transitioning into night.",
    exif: {
      camera: "Magical Night (Riyan)",
      lens: "Atmospheric Lens",
      aperture: "ƒ/1.8",
      shutter: "1/15s",
      iso: "ISO 500",
      focal: "26mm"
    },
    aspect: "tall",
    featured: true,
    order: 3
  },
  {
    id: "photo-4",
    slug: "moonlit-nightscape",
    title: "Moonlit Nightscape",
    url: `${PHOTOGRAPHY_CDN_BASE}${encodeURIComponent("LMC_20240928_180904_🌃Moonlit Night by Riyan (lmc8.4).jpg")}`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}${encodeURIComponent("LMC_20240928_180904_🌃Moonlit Night by Riyan (lmc8.4).jpg")}`,
    mediaType: "image",
    category: "night",
    categoryLabel: "Night & Twilight",
    location: "Midnight Sky",
    year: "2024",
    camera: "LMC 8.4 (Moonlit Profile)",
    lens: "Night Sight Tuning",
    story: "Atmospheric long exposure capturing natural night light and cloud silhouettes.",
    exif: {
      camera: "LMC 8.4 (Moonlit Profile)",
      lens: "Night Sight Tuning",
      aperture: "ƒ/1.8",
      shutter: "1/4s",
      iso: "ISO 1200",
      focal: "26mm"
    },
    aspect: "tall",
    featured: true,
    order: 4
  },
  {
    id: "photo-5",
    slug: "crescent-moonlit-dusk",
    title: "Crescent MoonLit Dusk",
    url: `${PHOTOGRAPHY_CDN_BASE}${encodeURIComponent("RIYAN_20241201_173110_🌙MoonLit Night by GleTech.jpg")}`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}${encodeURIComponent("RIYAN_20241201_173110_🌙MoonLit Night by GleTech.jpg")}`,
    mediaType: "image",
    category: "night",
    categoryLabel: "Night & Twilight",
    location: "Dusk Sky",
    year: "2024",
    camera: "GleTech MoonLit Profile",
    lens: "Astro Curve",
    story: "Deep sapphire sky gradient framing the gentle glow of the crescent moon.",
    exif: {
      camera: "GleTech MoonLit Profile",
      lens: "Astro Curve",
      aperture: "ƒ/1.8",
      shutter: "1/30s",
      iso: "ISO 640",
      focal: "26mm"
    },
    aspect: "tall",
    featured: true,
    order: 5
  },
  {
    id: "photo-6",
    slug: "sunset-ember-silhouette",
    title: "Sunset Ember & Silhouette",
    url: `${PHOTOGRAPHY_CDN_BASE}IMG_20251108_173948.jpg`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}IMG_20251108_173948.jpg`,
    mediaType: "image",
    category: "night",
    categoryLabel: "Night & Twilight",
    location: "Horizon Ridge",
    year: "2025",
    camera: "Low-Light HDR",
    lens: "Wide Angle",
    story: "A fiery crimson and amber twilight setting behind silhouettes of trees.",
    exif: {
      camera: "Low-Light HDR",
      lens: "Wide Angle",
      aperture: "ƒ/1.8",
      shutter: "1/60s",
      iso: "ISO 250",
      focal: "26mm"
    },
    aspect: "wide",
    featured: false,
    order: 6
  },
  {
    id: "photo-7",
    slug: "golden-hour-solitude",
    title: "Golden Hour Solitude",
    url: `${PHOTOGRAPHY_CDN_BASE}IMG_20250828_184614.jpg`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}IMG_20250828_184614.jpg`,
    mediaType: "image",
    category: "travel",
    categoryLabel: "Travel & Places",
    location: "Rural Horizon",
    year: "2025",
    camera: "Ultra-Clear Sensor",
    lens: "24mm Equiv",
    story: "Warm golden sunlight cutting through clouds across the expansive rural plains.",
    exif: {
      camera: "Ultra-Clear Sensor",
      lens: "24mm Equiv",
      aperture: "ƒ/1.9",
      shutter: "1/250s",
      iso: "ISO 100",
      focal: "24mm"
    },
    aspect: "wide",
    featured: false,
    order: 7
  },
  {
    id: "photo-8",
    slug: "autumn-meadow-serenade",
    title: "Autumn Meadow Serenade",
    url: `${PHOTOGRAPHY_CDN_BASE}IMG_20251104_164514.jpg`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}IMG_20251104_164514.jpg`,
    mediaType: "image",
    category: "nature",
    categoryLabel: "Nature & Mood",
    location: "Open Meadow",
    year: "2025",
    camera: "High Dynamic Range",
    lens: "35mm Equiv",
    story: "Gentle late-afternoon autumn light sweeping across calm fields.",
    exif: {
      camera: "High Dynamic Range",
      lens: "35mm Equiv",
      aperture: "ƒ/1.8",
      shutter: "1/500s",
      iso: "ISO 80",
      focal: "35mm"
    },
    aspect: "wide",
    featured: false,
    order: 8
  },
  {
    id: "photo-9",
    slug: "november-serenity",
    title: "November Serenity",
    url: `${PHOTOGRAPHY_CDN_BASE}IMG_20251118_160635.jpg`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}IMG_20251118_160635.jpg`,
    mediaType: "image",
    category: "nature",
    categoryLabel: "Nature & Mood",
    location: "Scenic Landscape",
    year: "2025",
    camera: "High Detail Sensor",
    lens: "50mm Equiv",
    story: "Peaceful landscape scene preserving crisp natural textures and horizon depth.",
    exif: {
      camera: "High Detail Sensor",
      lens: "50mm Equiv",
      aperture: "ƒ/1.8",
      shutter: "1/400s",
      iso: "ISO 100",
      focal: "50mm"
    },
    aspect: "wide",
    featured: false,
    order: 9
  },
  {
    id: "photo-10",
    slug: "midnight-cityscape-lights",
    title: "Midnight Cityscape & Lights",
    url: `${PHOTOGRAPHY_CDN_BASE}IMG_20260728_204122_1785249718155.jpg`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}IMG_20260728_204122_1785249718155.jpg`,
    mediaType: "image",
    category: "night",
    categoryLabel: "Night & Twilight",
    location: "Urban Street",
    year: "2026",
    camera: "Night Sight Pro",
    lens: "Wide 26mm",
    story: "Urban night atmosphere illuminated by warm ambient street lights.",
    exif: {
      camera: "Night Sight Pro",
      lens: "Wide 26mm",
      aperture: "ƒ/1.8",
      shutter: "1/10s",
      iso: "ISO 800",
      focal: "26mm"
    },
    aspect: "tall",
    featured: false,
    order: 10
  },
  {
    id: "photo-11",
    slug: "3am-solitude",
    title: "3 AM Solitude",
    url: `${PHOTOGRAPHY_CDN_BASE}MVIMG_20260303_030346.jpg`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}MVIMG_20260303_030346.jpg`,
    mediaType: "image",
    category: "night",
    categoryLabel: "Night & Twilight",
    location: "Late Night Studio",
    year: "2026",
    camera: "Motion Photo Lens",
    lens: "24mm Wide",
    story: "The peaceful, undisturbed silence of the late night hours.",
    exif: {
      camera: "Motion Photo Lens",
      lens: "24mm Wide",
      aperture: "ƒ/1.9",
      shutter: "1/8s",
      iso: "ISO 1600",
      focal: "24mm"
    },
    aspect: "wide",
    featured: false,
    order: 11
  },
  {
    id: "photo-12",
    slug: "lmc-daylight-atmosphere",
    title: "LMC Daylight Atmosphere",
    url: `${PHOTOGRAPHY_CDN_BASE}20230920_102034_lmc_8.4.jpg`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}20230920_102034_lmc_8.4.jpg`,
    mediaType: "image",
    category: "street",
    categoryLabel: "Street & Life",
    location: "Bangladesh",
    year: "2023",
    camera: "LMC 8.4 GCam",
    lens: "Wide 26mm",
    story: "Clean daylight frame captured using custom LMC 8.4 color profile.",
    exif: {
      camera: "LMC 8.4 GCam",
      lens: "Wide 26mm",
      aperture: "ƒ/1.8",
      shutter: "1/1000s",
      iso: "ISO 100",
      focal: "26mm"
    },
    aspect: "wide",
    featured: false,
    order: 12
  },
  {
    id: "photo-13",
    slug: "atmospheric-silhouette-field",
    title: "Atmospheric Silhouette & Field",
    url: `${PHOTOGRAPHY_CDN_BASE}FB_IMG_1689619749370.jpg`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}FB_IMG_1689619749370.jpg`,
    mediaType: "image",
    category: "street",
    categoryLabel: "Street & Life",
    location: "Field Shot",
    year: "2023",
    camera: "Mobile Lens",
    lens: "Standard 28mm",
    story: "Candid outdoor composition with natural sunlight and backlight.",
    exif: {
      camera: "Mobile Lens",
      lens: "Standard 28mm",
      aperture: "ƒ/2.0",
      shutter: "1/120s",
      iso: "ISO 100",
      focal: "28mm"
    },
    aspect: "wide",
    featured: false,
    order: 13
  },
  {
    id: "photo-14",
    slug: "winter-morning-mist",
    title: "Winter Morning Mist",
    url: `${PHOTOGRAPHY_CDN_BASE}IMG-20230127-WA0070.jpg`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}IMG-20230127-WA0070.jpg`,
    mediaType: "image",
    category: "nature",
    categoryLabel: "Nature & Mood",
    location: "Winter Morning",
    year: "2023",
    camera: "Mobile Sensor",
    lens: "Standard",
    story: "Soft winter morning mist blanketing the greenery.",
    exif: {
      camera: "Mobile Sensor",
      lens: "Standard",
      aperture: "ƒ/2.2",
      shutter: "1/200s",
      iso: "ISO 150",
      focal: "28mm"
    },
    aspect: "wide",
    featured: false,
    order: 14
  },
  {
    id: "photo-15",
    slug: "sunlit-afternoon-canopy",
    title: "Sunlit Afternoon Canopy",
    url: `${PHOTOGRAPHY_CDN_BASE}IMG_20230207_140034~2.jpg`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}IMG_20230207_140034~2.jpg`,
    mediaType: "image",
    category: "nature",
    categoryLabel: "Nature & Mood",
    location: "Open Air",
    year: "2023",
    camera: "High-Res Sensor",
    lens: "Prime Lens",
    story: "Clear skies and lush green canopy illuminated by brilliant afternoon sun.",
    exif: {
      camera: "High-Res Sensor",
      lens: "Prime Lens",
      aperture: "ƒ/1.8",
      shutter: "1/800s",
      iso: "ISO 50",
      focal: "26mm"
    },
    aspect: "tall",
    featured: false,
    order: 15
  },
  {
    id: "photo-16",
    slug: "cinematic-twilight-motion",
    title: "Cinematic Twilight Motion",
    url: `${PHOTOGRAPHY_CDN_BASE}VID_20260314_181425.mp4`,
    thumb: `${PHOTOGRAPHY_CDN_BASE}${encodeURIComponent("20240803_180241_🌆Magical Night by Riyan.jpg")}`,
    mediaType: "video",
    category: "travel",
    categoryLabel: "Motion & Film",
    location: "Field Video Footage",
    year: "2026",
    camera: "1080p 60fps Sensor",
    lens: "Optical Stabilization",
    story: "Real-time twilight video capturing atmospheric natural breeze and dusk sky.",
    exif: {
      camera: "1080p 60fps Video",
      lens: "Optical Stabilization",
      aperture: "ƒ/1.8",
      shutter: "1/60s",
      iso: "ISO 400",
      focal: "26mm"
    },
    aspect: "tall",
    featured: true,
    order: 16
  }
];

export async function getPhotos(): Promise<PhotoItem[]> {
  try {
    const rows = await db.select().from(galleryPhotos).orderBy(asc(galleryPhotos.order));
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: `photo-${r.id}`,
        slug: r.slug,
        title: r.title,
        url: r.url,
        thumb: r.thumb || r.url,
        mediaType: (r.mediaType as any) || "image",
        category: r.category || "nature",
        categoryLabel: r.categoryLabel || "Photography",
        location: r.location || "Field Notes",
        year: r.year || "2026",
        story: r.story || "Captured on location.",
        exif: {
          camera: r.camera || "Digital Sensor",
          lens: r.lens || "Wide Lens",
          aperture: r.aperture || "ƒ/1.8",
          shutter: r.shutter || "1/120s",
          iso: r.iso || "ISO 200",
          focal: r.focal || "26mm"
        },
        aspect: (r.aspect as any) || "wide",
        featured: Boolean(r.featured),
        order: r.order || 0
      }));
    }
  } catch (err) {
    console.error("Error loading gallery from DB:", err);
  }
  return defaultPhotosList;
}

export const photos: PhotoItem[] = defaultPhotosList;
