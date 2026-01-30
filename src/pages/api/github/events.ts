import type { APIRoute } from 'astro';
import { getCachedData, setCachedData } from '../../../lib/redis';

export const prerender = false;

// Function to format time ago
function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";

    return Math.floor(seconds) + "s ago";
}

export const GET: APIRoute = async () => {
    try {
        const token = import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
        const username = import.meta.env.PUBLIC_GITHUB || process.env.PUBLIC_GITHUB || 'swadhinbiswas';

        if (!token) {
            return new Response(JSON.stringify({ error: 'Missing GitHub Token' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Try to get from cache first
        const cacheKey = `github_events_${username}`;
        const cached = await getCachedData(cacheKey);
        if (cached) {
            return new Response(JSON.stringify(cached), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=600',
                    'X-Cache': 'HIT'
                }
            });
        }

        // Fetch from Official GitHub Events API
        // Fetch up to 6 events (max per page) to show "all data" as requested
        const response = await fetch(`https://api.github.com/users/${username}/events?per_page=6`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'cloudflare-worker'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
        }

        const events = await response.json();

        // Process events into the "commit" structure expected by frontend
        const activity = events.map((event: any) => {
            const repoName = event.repo.name.split('/')[1] || event.repo.name;
            const time = timeAgo(event.created_at);
            let message = 'No description';
            let hash = 'event';
            let url = `https://github.com/${event.repo.name}`;

            switch (event.type) {
                case 'PushEvent':
                    if (event.payload.commits && event.payload.commits.length > 0) {
                        message = event.payload.commits[0].message;
                        hash = event.payload.commits[0].sha.substring(0, 7);
                        // Make generic URL if specific commit URL isn't easily constructed without more calls,
                        // or construct it: repo/commit/sha
                        url = `https://github.com/${event.repo.name}/commit/${event.payload.commits[0].sha}`;
                    } else {
                        message = 'Pushed to repository';
                    }
                    break;
                case 'WatchEvent':
                    message = 'Starred repository';
                    break;
                case 'CreateEvent':
                    if (event.payload.ref_type === 'repository') {
                        message = 'Created repository';
                    } else if (event.payload.ref_type === 'branch') {
                        message = `Created branch ${event.payload.ref}`;
                    } else {
                        message = 'Created ' + event.payload.ref_type;
                    }
                    break;
                case 'PullRequestEvent':
                    message = `${event.payload.action === 'opened' ? 'Opened' : 'Merged'} PR #${event.payload.number}`;
                    url = event.payload.pull_request.html_url;
                    hash = `PR-${event.payload.number}`;
                    break;
                case 'IssuesEvent':
                    message = `${event.payload.action === 'opened' ? 'Opened' : 'Closed'} issue #${event.payload.issue.number}`;
                    url = event.payload.issue.html_url;
                    hash = `IS-${event.payload.issue.number}`;
                    break;
                case 'ForkEvent':
                    message = `Forked ${event.repo.name}`;
                    break;
                case 'ReleaseEvent':
                    message = `Released ${event.payload.release.tag_name}`;
                    url = event.payload.release.html_url;
                    break;
                default:
                    message = event.type.replace('Event', ''); // Fallback: "fuzzy" type name
                    break;
            }

            return {
                message: message,
                repo: repoName,
                time: time,
                url: url,
                hash: hash,
                verified: true // standardized for visual consistency
            };
        });

        const responseData = { commits: activity };

        // Cache the result
        await setCachedData(cacheKey, responseData, 600); // 10 minutes

        return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=600',
                'X-Cache': 'MISS'
            }
        });

    } catch (error: any) {
        console.error('Events API error:', error);

        // Fallback: Try to serve stale cache to avoid empty UI
        const cacheKey = `github_events_${import.meta.env.PUBLIC_GITHUB || 'swadhinbiswas'}`;
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

        return new Response(JSON.stringify({
            commits: [{
                message: 'Unable to load recent activity',
                repo: 'system',
                time: 'now',
                url: '#',
                hash: 'error',
                verified: false
            }]
        }), {
            status: 200, // Return 200 so frontend doesn't crash
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            }
        });
    }
};
