// Prerender the entire site to static HTML at build time. It's all static
// content, so this makes every route a cached file on Vercel — fast and cheap —
// and means the SEO tags land in the static HTML for crawlers. Dynamic routes
// (blog/[slug], projects/[slug]) already enumerate their `entries`.
export const prerender = true;
