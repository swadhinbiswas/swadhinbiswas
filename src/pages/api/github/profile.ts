import type { APIRoute } from "astro";
import { db } from "../../../db";
import { apiCache } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { siteConfig } from "../../../config/site";

const CACHE_KEY = "github_profile";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour (User profile changes less often)

export const GET: APIRoute = async () => {
    try {
        const now = Date.now();

        // 1. Check Cache
        const cached = await db
            .select()
            .from(apiCache)
            .where(eq(apiCache.key, CACHE_KEY))
            .get();

        if (cached && now - cached.updatedAt < CACHE_DURATION) {
            return new Response(cached.data, {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 2. Fetch from GitHub
        const username = siteConfig.socials.find((s) => s.icon === "github")?.url.split("/").pop() || "swadhinbiswas";
        const headers: HeadersInit = { "User-Agent": "Astro-Portfolio" };

        if (import.meta.env.GITHUB_TOKEN) {
            headers["Authorization"] = `Bearer ${import.meta.env.GITHUB_TOKEN}`;
        }

        const res = await fetch(`https://api.github.com/users/${username}`, { headers });

        if (!res.ok) throw new Error("Failed to fetch profile");
        const profile = await res.json();

        const data = {
            login: profile.login,
            avatar_url: profile.avatar_url,
            html_url: profile.html_url,
            name: profile.name,
            company: profile.company,
            blog: profile.blog,
            location: profile.location,
            bio: profile.bio,
            public_repos: profile.public_repos,
            followers: profile.followers,
            following: profile.following,
        };

        const jsonString = JSON.stringify(data);

        // 3. Update Cache
        await db
            .insert(apiCache)
            .values({
                key: CACHE_KEY,
                data: jsonString,
                updatedAt: now,
            })
            .onConflictDoUpdate({
                target: apiCache.key,
                set: {
                    data: jsonString,
                    updatedAt: now,
                },
            });

        return new Response(jsonString, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching github profile:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch profile" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
