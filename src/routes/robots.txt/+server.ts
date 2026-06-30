import { siteUrl } from '$lib/site';

// Prerendered to a static robots.txt; points crawlers at the sitemap.
export const prerender = true;

export function GET() {
	const body = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
}
