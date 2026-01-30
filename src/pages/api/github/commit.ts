import type { APIRoute } from "astro";
import { db } from "../../../db";
import { apiCache } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { siteConfig } from "../../../config/site";

const CACHE_KEY = "latest_commit";
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

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

        // Step A: Get latest pushed repo
        const reposRes = await fetch(
            `https://api.github.com/users/${username}/repos?sort=pushed&direction=desc&per_page=1`,
            { headers }
        );

        if (!reposRes.ok) throw new Error("Failed to fetch repos");
        const repos = await reposRes.json();
        if (!repos.length) throw new Error("No repos found");

        const latestRepo = repos[0];

        // Step B: Get latest commit
        const commitsRes = await fetch(
            `https://api.github.com/repos/${username}/${latestRepo.name}/commits?per_page=1`,
            { headers }
        );

        if (!commitsRes.ok) throw new Error("Failed to fetch commits");
        const commits = await commitsRes.json();
        if (!commits.length) throw new Error("No commits found");

        const latestCommit = commits[0];
        const shortSha = latestCommit.sha.substring(0, 7);

        const data = {
            sha: shortSha,
            url: `https://github.com/${username}/${latestRepo.name}/commit/${latestCommit.sha}`,
            repo: latestRepo.name,
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
        console.error("Error fetching github commit:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch commit" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
