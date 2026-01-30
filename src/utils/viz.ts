import { createHash } from 'crypto';
import { uploadImage, getOptimizedUrl } from '../lib/cloudinary';

// Chart.js SSR Renderer
// Chart.js SSR Renderer removed due to Cloudflare incompatibility
// Using client-side rendering fallback exclusively

// Helper to generate hash
function getHash(content: string): string {
    return createHash('md5').update(content).digest('hex');
}

// Flow Diagram SVG Renderer (Server-Side)
function renderFlowSVG(config: any): string {
    const nodes = config.nodes || [];
    const edges = config.edges || [];

    if (nodes.length === 0) return '<svg width="200" height="100"><text x="10" y="50" fill="gray">No nodes</text></svg>';

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach((n: any) => {
        minX = Math.min(minX, n.position.x);
        minY = Math.min(minY, n.position.y);
        maxX = Math.max(maxX, n.position.x);
        maxY = Math.max(maxY, n.position.y);
    });

    const padding = 80;
    const nodeWidth = 120;
    const nodeHeight = 40;
    const width = Math.max(300, maxX - minX + nodeWidth + padding * 2);
    const height = maxY - minY + nodeHeight + padding * 2;
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#89b4fa"/></marker></defs>`;

    // Draw edges
    edges.forEach((edge: any) => {
        const source = nodes.find((n: any) => n.id === edge.source);
        const target = nodes.find((n: any) => n.id === edge.target);
        if (source && target) {
            const x1 = source.position.x + offsetX + nodeWidth / 2;
            const y1 = source.position.y + offsetY + nodeHeight;
            const x2 = target.position.x + offsetX + nodeWidth / 2;
            const y2 = target.position.y + offsetY;
            const dashArray = edge.animated ? 'stroke-dasharray="5,5"' : '';
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#89b4fa" stroke-width="2" ${dashArray} marker-end="url(#arrow)"/>`;
        }
    });

    // Draw nodes
    nodes.forEach((node: any) => {
        const x = node.position.x + offsetX;
        const y = node.position.y + offsetY;
        const label = node.data?.label || node.id;
        svg += `<rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" rx="8" fill="#313244" stroke="#585b70" stroke-width="1"/>`;
        svg += `<text x="${x + nodeWidth / 2}" y="${y + nodeHeight / 2 + 5}" text-anchor="middle" fill="#cdd6f4" font-size="14" font-family="system-ui, sans-serif">${label}</text>`;
    });

    svg += `</svg>`;
    return svg;
}

// In-memory cache to avoid repeated Cloudinary checks
const cloudinaryCache = new Map<string, string>();

export async function processVisualizations(content: string) {
    const regex = /```\s*(chart|flow|plotly|mermaid)\s*[\r\n]+([\s\S]*?)```/gm;

    let processing = content;
    const matches = [...content.matchAll(regex)];

    for (const match of matches) {
        const [fullMatch, type, configStr] = match;
        const hash = getHash(configStr.trim());
        const fileName = `${type}-${hash}`;
        const cloudinaryPublicId = `portfolio/viz/${fileName}`;

        let replacement = '';

        try {
            // For mermaid, we don't parse as JSON - render client-side
            if (type === 'mermaid') {
                replacement = `<div class="mermaid">${configStr.trim()}</div>`;
            }
            else {
                const config = JSON.parse(configStr.trim());

                if (type === 'chart') {
                    // Check in-memory cache first
                    if (cloudinaryCache.has(cloudinaryPublicId)) {
                        const cachedUrl = cloudinaryCache.get(cloudinaryPublicId)!;
                        replacement = `<img src="${cachedUrl}" alt="Chart Visualization" class="w-full h-auto max-w-[600px] mx-auto" loading="lazy" />`;
                    } else {
                        // Cloudflare Pages cannot run node-canvas (requires native bindings).
                        // Fallback purely to client-side rendering.

                        // Client-side fallback
                        const encodedConfig = encodeURIComponent(JSON.stringify(config));
                        replacement = `<canvas class="chart-js w-full h-auto max-w-[600px] mx-auto" data-config="${encodedConfig}"></canvas>`;
                    }
                }
                else if (type === 'flow') {
                    // Check in-memory cache first
                    if (cloudinaryCache.has(cloudinaryPublicId)) {
                        const cachedUrl = cloudinaryCache.get(cloudinaryPublicId)!;
                        replacement = `<img src="${cachedUrl}" alt="Flow Diagram" class="w-full h-auto max-w-[600px] mx-auto" loading="lazy" />`;
                    } else {
                        const svg = renderFlowSVG(config);
                        const svgBuffer = Buffer.from(svg);

                        try {
                            const base64Svg = `data:image/svg+xml;base64,${svgBuffer.toString('base64')}`;
                            const result = await uploadImage(base64Svg, { public_id: cloudinaryPublicId, overwrite: false });
                            if (result.success && result.url) {
                                cloudinaryCache.set(cloudinaryPublicId, result.url);
                                replacement = `<img src="${result.url}" alt="Flow Diagram" class="w-full h-auto max-w-[600px] mx-auto" loading="lazy" />`;
                            } else {
                                throw new Error(result.error || 'Upload failed');
                            }
                        } catch (uploadError) {
                            // Fallback to inline SVG if upload fails
                            replacement = svg;
                        }
                    }
                }
                else if (type === 'plotly') {
                    // Plotly still renders client-side
                    const encodedConfig = encodeURIComponent(JSON.stringify(config));
                    replacement = `<div class="plotly-container" style="width: 100%; height: 400px;" data-config="${encodedConfig}"></div>`;
                }
            }

            processing = processing.replace(fullMatch, replacement);

        } catch (e) {
            console.error(`Failed to process ${type} viz:`, e);
            processing = processing.replace(fullMatch, `<div class="text-red-400">Error rendering visualization: ${(e as Error).message}</div>`);
        }
    }

    return processing;
}
