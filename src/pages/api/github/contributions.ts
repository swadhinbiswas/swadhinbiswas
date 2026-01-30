
import { getCachedData, setCachedData } from '../../../lib/redis';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
    const token = import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    const username = import.meta.env.PUBLIC_GITHUB || process.env.PUBLIC_GITHUB || 'swadhinbiswas';

    try {

        if (!token) {
            return new Response(JSON.stringify({ error: 'Missing GitHub Token' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Try to get from cache first
        const cacheKey = `github_stats_${username}`;
        const cached = await getCachedData(cacheKey);
        if (cached) {
            return new Response(JSON.stringify(cached), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=43200', // 12 hours
                    'X-Cache': 'HIT'
                }
            });
        }

        // 1. Fetch contribution years
        // Correct nesting: user -> contributionsCollection -> contributionYears
        const yearsQuery = `
            query($username: String!) {
                user(login: $username) {
                    contributionsCollection {
                        contributionYears
                    }
                }
            }
        `;

        const yearsResponse = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'cloudflare-worker'
            },
            body: JSON.stringify({ query: yearsQuery, variables: { username } })
        });

        if (!yearsResponse.ok) {
            throw new Error(`Failed to fetch years: ${yearsResponse.status} ${yearsResponse.statusText}`);
        }

        const yearsData = await yearsResponse.json();
        if (yearsData.errors) {
            throw new Error(`GraphQL errors fetching years: ${JSON.stringify(yearsData.errors)}`);
        }

        const years = yearsData.data?.user?.contributionsCollection?.contributionYears;
        if (!years || years.length === 0) {
            throw new Error(`No contribution years found for ${username}`);
        }

        // 2. Fetch stats for each year
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

        let totalCommits = 0;
        let totalIssues = 0;
        let totalPRs = 0;
        let totalReviews = 0;
        let lifetimeContributions = 0;
        let currentCalendar: any = null;

        const requests = years.map(async (year: number) => {
            const from = `${year}-01-01T00:00:00Z`;
            const to = `${year}-12-31T23:59:59Z`;

            try {
                const res = await fetch('https://api.github.com/graphql', {
                    method: 'POST',
                    headers: { 'Authorization': `bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: statsQuery,
                        variables: { username, from, to }
                    })
                });

                if (!res.ok) return null;
                const data = await res.json();
                if (data.errors) return null;

                const collection = data.data.user.contributionsCollection;
                return {
                    year,
                    commits: collection.totalCommitContributions,
                    issues: collection.totalIssueContributions,
                    prs: collection.totalPullRequestContributions,
                    reviews: collection.totalPullRequestReviewContributions,
                    total: collection.contributionCalendar.totalContributions,
                    calendar: collection.contributionCalendar
                };
            } catch (e) {
                return null;
            }
        });

        const results = await Promise.all(requests);

        results.forEach(res => {
            if (!res) return;
            totalCommits += res.commits;
            totalIssues += res.issues;
            totalPRs += res.prs;
            totalReviews += res.reviews;
            lifetimeContributions += res.total;

            // Use the latest year (first in the list usually) for the calendar
            if (res.year === years[0]) {
                currentCalendar = res.calendar;
            }
        });

        // Prepare response data
        const responseData = {
            totalContributions: lifetimeContributions,
            lifetimeContributions: lifetimeContributions,
            weeks: currentCalendar ? currentCalendar.weeks : [], // Full year weeks
            last7Days: currentCalendar ? currentCalendar.weeks.slice(-1) : [], // Just last week
            breakdown: {
                commits: totalCommits,
                issues: totalIssues,
                prs: totalPRs,
                reviews: totalReviews
            }
        };

        // Cache the result
        await setCachedData(cacheKey, responseData, 43200); // 12 hours

        return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600',
                'X-Cache': 'MISS'
            }
        });

    } catch (error: any) {
        console.error('GitHub API error:', error);

        // Fallback: Try to serve stale cache to avoid empty UI
        const cacheKey = `github_stats_${username || 'swadhinbiswas'}`;
        const cached = await getCachedData(cacheKey);
        if (cached) {
            return new Response(JSON.stringify(cached), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=60',
                    'X-Cache': 'STALE'
                }
            });
        }

        // Return fallback data instead of crashing
        const fallbackData = {
            totalContributions: 0,
            lifetimeContributions: 0,
            weeks: [],
            last7Days: [],
            breakdown: {
                commits: 0,
                issues: 0,
                prs: 0,
                reviews: 0
            },
            error: error.message // Include error for debugging if needed
        };

        return new Response(JSON.stringify(fallbackData), {
            status: 200, // Return 200 to prevent UI crash
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            }
        });
    }
};
