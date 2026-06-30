import { getPostSlugs } from '$lib/posts';
import { getProjectSlugs } from '$lib/content';
import { nav, legal, siteUrl } from '$lib/site';

// Prerendered to a static sitemap.xml at build time.
export const prerender = true;

export function GET() {
	const routes = [
		// Top-level pages + legal, derived from the nav so new pages are included.
		...[...nav, ...legal].map((n) => n.path),
		...getProjectSlugs().map((slug) => `/projects/${slug}`),
		...getPostSlugs().map((slug) => `/blog/${slug}`)
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((path) => `\t<url><loc>${siteUrl}${path}</loc></url>`).join('\n')}
</urlset>`;

	return new Response(body, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' }
	});
}
