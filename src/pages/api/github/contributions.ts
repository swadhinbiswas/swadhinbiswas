import { getCachedData, setCachedData } from '../../../lib/redis';
import { db } from "../../../db";
import { apiCache } from "../../../db/schema";
import { eq } from "drizzle-orm";
import type { APIRoute } from 'astro';

export const prerender = false;

const DB_CACHE_KEY = "github_contributions_summary";
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

export const GET: APIRoute = async () => {
    const now = Date.now();
    const token = import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    const username = import.meta.env.PUBLIC_GITHUB || 'swadhinbiswas';

    // Return fallback data if no token
    if (!token) {
        return new Response(JSON.stringify({
            totalContributions: 0,
            lifetimeContributions: 0,
            weeks: [],
            breakdown: { commits: 0, issues: 0, prs: 0, reviews: 0 }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        // 1. Try Redis
        const cacheKey = `github_stats_${username}`;
        const cached = await getCachedData(cacheKey);
        if (cached) {
            return new Response(JSON.stringify(cached), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT-REDIS' }
            });
        }

        // 2. Try DB
        let dbCached = null;
        try {
            dbCached = await db.select().from(apiCache).where(eq(apiCache.key, DB_CACHE_KEY)).get();
        } catch {}

        if (dbCached && now - dbCached.updatedAt < CACHE_DURATION) {
            return new Response(dbCached.data, {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT-DB' }
            });
        }

        // 3. Fetch from GitHub (Slow)
        console.log('[github/contributions] Cache miss, fetching fresh data...');
        const yearsQuery = `query($username: String!) { user(login: $username) { contributionsCollection { contributionYears } } }`;
        const yearsResponse = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: { 'Authorization': `bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: yearsQuery, variables: { username } })
        });

        const yearsData = await yearsResponse.json();
        const years = yearsData.data?.user?.contributionsCollection?.contributionYears;
        if (!years) throw new Error("No years found");

        const statsQuery = `
            query($username: String!, $from: DateTime!, $to: DateTime!) {
                user(login: $username) {
                    contributionsCollection(from: $from, to: $to) {
                        totalCommitContributions
                        totalIssueContributions
                        totalPullRequestContributions
                        totalPullRequestReviewContributions
                        contributionCalendar {
                            totalContributions
                            weeks {
                                contributionDays {
                                    contributionCount
                                    date
                                    color
                                }
                            }
                        }
                    }
                }
            }
        `;

        let totalCommits = 0, totalIssues = 0, totalPRs = 0, totalReviews = 0, lifetime = 0;
        let currentCalendar = null;

        const results = await Promise.all(years.map(async (year: number) => {
            const res = await fetch('https://api.github.com/graphql', {
                method: 'POST',
                headers: { 'Authorization': `bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: statsQuery, variables: { username, from: `${year}-01-01T00:00:00Z`, to: `${year}-12-31T23:59:59Z` } })
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.data?.user?.contributionsCollection;
        }));

        results.forEach((col, idx) => {
            if (!col) return;
            totalCommits += col.totalCommitContributions;
            totalIssues += col.totalIssueContributions;
            totalPRs += col.totalPullRequestContributions;
            totalReviews += col.totalPullRequestReviewContributions;
            lifetime += col.contributionCalendar.totalContributions;
            if (idx === 0) currentCalendar = col.contributionCalendar;
        });

        const responseData = {
            totalContributions: lifetime,
            lifetimeContributions: lifetime,
            weeks: currentCalendar ? currentCalendar.weeks : [],
            breakdown: { commits: totalCommits, issues: totalIssues, prs: totalPRs, reviews: totalReviews }
        };

        const jsonString = JSON.stringify(responseData);
        await Promise.all([
            setCachedData(cacheKey, responseData, CACHE_DURATION / 1000),
            db.insert(apiCache).values({ key: DB_CACHE_KEY, data: jsonString, updatedAt: now })
                .onConflictDoUpdate({ target: apiCache.key, set: { data: jsonString, updatedAt: now } })
        ]);

        return new Response(jsonString, {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
        });

    } catch (error: any) {
        if (dbCached) return new Response(dbCached.data, { status: 200, headers: { 'Content-Type': 'application/json', 'X-Cache': 'STALE-FALLBACK' } });
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
