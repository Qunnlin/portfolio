import { getPosts } from '$lib/posts';
import { site, siteUrl } from '$lib/site';

// Prerendered to a static RSS 2.0 feed at build time.
export const prerender = true;

function esc(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function GET() {
	const items = getPosts()
		.map(
			(p) => `\t\t<item>
\t\t\t<title>${esc(p.title)}</title>
\t\t\t<description>${esc(p.description)}</description>
\t\t\t<link>${siteUrl}/blog/${p.slug}</link>
\t\t\t<guid>${siteUrl}/blog/${p.slug}</guid>
\t\t\t<pubDate>${new Date(p.date).toUTCString()}</pubDate>
\t\t</item>`
		)
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
\t<channel>
\t\t<title>${esc(site.name)} — Blog</title>
\t\t<link>${siteUrl}/blog</link>
\t\t<description>${esc(site.description)}</description>
\t\t<atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
\t\t<language>en</language>
${items}
\t</channel>
</rss>`;

	return new Response(body, {
		headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
	});
}
