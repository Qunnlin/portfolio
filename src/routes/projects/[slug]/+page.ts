import { error } from '@sveltejs/kit';
import { getProject, getProjectSlugs } from '$lib/content';
import type { EntryGenerator, PageLoad } from './$types';

// Prerender every project page to static HTML at build time.
export const prerender = true;

// Enumerate slugs explicitly so prerendering doesn't rely on link-crawling.
export const entries: EntryGenerator = () => getProjectSlugs().map((slug) => ({ slug }));

export const load: PageLoad = ({ params }) => {
	const project = getProject(params.slug);
	if (!project) error(404, `Project not found: ${params.slug}`);
	return { project };
};
