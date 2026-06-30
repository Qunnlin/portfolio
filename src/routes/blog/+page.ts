import { getPosts } from '$lib/posts';

// Prerender the blog index to static HTML at build time (no per-request work).
export const prerender = true;

export function load() {
	return { posts: getPosts() };
}
