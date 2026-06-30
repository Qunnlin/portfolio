import { error } from '@sveltejs/kit';
import { getPosts, getPostSlugs, type PostMeta } from '$lib/posts';
import type { EntryGenerator, PageLoad } from './$types';

// Prerender every post to static HTML at build time.
export const prerender = true;

// Enumerate slugs explicitly so prerendering doesn't rely on link-crawling.
export const entries: EntryGenerator = () => getPostSlugs().map((slug) => ({ slug }));

export const load: PageLoad = async ({ params }) => {
	try {
		// Vite turns this template-literal import into a glob over ../../../posts/*.md.
		const post = await import(`../../../posts/${params.slug}.md`);
		const summary = getPosts().find((p) => p.slug === params.slug);
		return {
			content: post.default,
			meta: post.metadata as PostMeta,
			readingMinutes: summary?.readingMinutes ?? 1
		};
	} catch {
		error(404, `Post not found: ${params.slug}`);
	}
};
