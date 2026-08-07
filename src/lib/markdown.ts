import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

export interface RenderFeatures {
  hasMermaid: boolean;
  hasPlotly: boolean;
  hasCharts: boolean;
  hasFlow: boolean;
  hasMath: boolean;
  hasCallouts: boolean;
  hasEmbeds: boolean;
}

interface CalloutStyle {
  icon: string;
  color: string;
}

const CALLOUT_STYLES: Record<string, CalloutStyle> = {
  note:    { icon: "💡", color: "#89b4fa" },
  info:    { icon: "ℹ️", color: "#74c7ec" },
  tip:     { icon: "💡", color: "#a6e3a1" },
  warning: { icon: "⚠️", color: "#f9e2af" },
  danger:  { icon: "🔥", color: "#f38ba8" },
  question:{ icon: "❓", color: "#cba6f7" },
  abstract:{ icon: "📋", color: "#94e2d5" },
  success: { icon: "✅", color: "#a6e3a1" },
  failure: { icon: "❌", color: "#f38ba8" },
  bug:     { icon: "🐛", color: "#f38ba8" },
  example: { icon: "📝", color: "#cba6f7" },
  quote:   { icon: "💬", color: "#a6adc8" },
  todo:    { icon: "☑️", color: "#94e2d5" },
};

const CALLOUT_TYPES: Record<string, string> = {
  note: "note", info: "info", tip: "tip", warning: "warning", danger: "danger",
  question: "question", abstract: "abstract", summary: "abstract", tldr: "abstract",
  success: "success", done: "success", failure: "failure", fail: "failure", missing: "failure",
  bug: "bug", example: "example", quote: "quote", cite: "quote",
  todo: "todo", caution: "warning", attention: "warning", important: "info",
  hint: "tip", check: "success", error: "danger", faq: "question",
  q: "question", help: "question",
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings)
  .use(rehypeKatex)
  .use(rehypeHighlight)
  .use(rehypeStringify, { allowDangerousHtml: true });

function preprocessCodeBlocks(raw: string): { text: string } {
  let text = raw;

  text = text.replace(/```mermaid\n([\s\S]*?)```/g, (_, code: string) =>
    `<div class="mermaid">${code.trim()}</div>`
  );

  text = text.replace(/```plotly\n([\s\S]*?)```/g, (_, code: string) =>
    `<div class="plotly-container" data-config='${encodeURIComponent(code.trim())}'></div>`
  );

  text = text.replace(/```chart\n([\s\S]*?)```/g, (_, code: string) =>
    `<div class="chart-container" data-config='${encodeURIComponent(code.trim())}'></div>`
  );

  text = text.replace(/```flow\n([\s\S]*?)```/g, (_, code: string) =>
    `<div class="flow-container" data-config='${encodeURIComponent(code.trim())}'></div>`
  );

  text = text.replace(/!\[\[([\w-]+)\]\]/g, (_, slug: string) =>
    `<a href="/posts/${slug}" class="embed-link" data-embed-slug="${slug}">📄 ${slug.replace(/-/g, " ")}</a>`
  );

  return { text };
}

function postprocessHtml(html: string): { html: string; features: RenderFeatures } {
  const features: RenderFeatures = {
    hasMermaid: false, hasPlotly: false, hasCharts: false, hasFlow: false,
    hasMath: false, hasCallouts: false, hasEmbeds: false,
  };

  let result = html;

  result = result.replace(
    /<blockquote>\s*<p>\s*\[!(\w+)\]\s*(.*?)<\/p>([\s\S]*?)<\/blockquote>/gi,
    (_: string, type: string, title: string, content: string) => {
      features.hasCallouts = true;
      const ct = CALLOUT_TYPES[type.toLowerCase()] || "note";
      const cs = CALLOUT_STYLES[ct] || CALLOUT_STYLES.note!;
      const displayTitle = title || ct.charAt(0).toUpperCase() + ct.slice(1);
      const cleanContent = content.replace(/^\s*<br>\s*/i, "").trim();
      return `<div class="callout callout-${ct}" style="--callout-color: ${cs.color}">
        <div class="callout-title">${cs.icon} ${displayTitle}</div>
        <div class="callout-content">${cleanContent}</div>
      </div>`;
    }
  );

  result = result.replace(
    /<p><strong>Q:<\/strong>\s*(.*?)<\/p>\s*<p><strong>A:<\/strong>\s*(.*?)<\/p>/gi,
    (_: string, q: string, a: string) => {
      features.hasCallouts = true;
      const cs = CALLOUT_STYLES.question!;
      return `<div class="callout callout-question" style="--callout-color: ${cs.color}">
        <div class="callout-title">${cs.icon} Q&A</div>
        <div class="callout-content"><p><strong>Q:</strong> ${q}</p><p><strong>A:</strong> ${a}</p></div>
      </div>`;
    }
  );

  features.hasMermaid = result.includes('class="mermaid"');
  features.hasPlotly = result.includes('class="plotly-container"');
  features.hasCharts = result.includes('class="chart-container"');
  features.hasFlow = result.includes('class="flow-container"');
  features.hasMath = result.includes('class="katex"');
  features.hasEmbeds = result.includes('class="embed-link"');

  return { html: result, features };
}

export async function renderMarkdown(
  raw: string,
): Promise<{ html: string; features: RenderFeatures }> {
  const { text } = preprocessCodeBlocks(raw || "");
  const processed = await processor.process(text);
  const { html, features } = postprocessHtml(processed.toString());
  return { html, features };
}
