/**
 * Blog content layer.
 *
 * Posts are markdown files in `src/posts/*.md` with YAML frontmatter. mdsvex
 * compiles each one to a Svelte component whose named `metadata` export is the
 * frontmatter. `import.meta.glob` lets Vite discover every post at build time,
 * so adding a post is just dropping a `.md` file in — no registry to update.
 */

/** Frontmatter shape every post must provide (see src/posts for examples). */
export interface PostMeta {
	title: string;
	/** ISO date string, e.g. "2026-06-28". Used for sorting and display. */
	date: string;
	description: string;
	/** Optional topic tags shown on the listing and the post. */
	tags?: string[];
	/** Set to false to keep a post out of the listing (still reachable by URL only if linked). */
	published?: boolean;
}

/** A post's metadata plus its slug and derived reading time. */
export interface PostSummary extends PostMeta {
	slug: string;
	/** Estimated reading time in minutes (from the markdown word count). */
	readingMinutes: number;
}

/**
 * All published posts, newest first. Reads frontmatter eagerly (metadata only,
 * not the rendered component) so the listing stays cheap.
 */
export function getPosts(): PostSummary[] {
	const modules = import.meta.glob<{ metadata: PostMeta }>('/src/posts/*.md', { eager: true });

	return Object.entries(modules)
		.map(([path, mod]) => {
			const slug = path.split('/').pop()!.replace(/\.md$/, '');
			const meta = mod.metadata;
			// The `metadata` type is a compile-time assertion only — mdsvex doesn't
			// validate frontmatter at runtime. Since the blog is prerendered, throwing
			// here fails the build, so an authoring mistake is caught immediately
			// instead of shipping a post with "undefined"/"Invalid Date" on screen.
			for (const field of ['title', 'date', 'description'] as const) {
				if (!meta?.[field]) {
					throw new Error(`Post "${slug}" is missing required frontmatter: ${field}`);
				}
			}
			if (Number.isNaN(new Date(meta.date).getTime())) {
				throw new Error(`Post "${slug}" has an invalid date "${meta.date}" (use ISO, e.g. 2026-06-28)`);
			}
			return { slug, ...meta, readingMinutes: readingMinutes(slug) };
		})
		.filter((post) => post.published !== false)
		.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

/** Slugs of all published posts — used to enumerate prerender entries. */
export function getPostSlugs(): string[] {
	return getPosts().map((p) => p.slug);
}

// Raw markdown source of every post, for rendering post bodies as terminal text.
const rawPosts = import.meta.glob('/src/posts/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

/** The markdown body of a post (frontmatter stripped), or null if unknown. */
export function getPostBody(slug: string): string | null {
	const entry = Object.entries(rawPosts).find(([path]) => path.endsWith(`/${slug}.md`));
	if (!entry) return null;
	return entry[1].replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
}

/** Real byte size of a post's `.md` source file (used for the `ls -al` size column). */
export function getPostSize(slug: string): number {
	const entry = Object.entries(rawPosts).find(([path]) => path.endsWith(`/${slug}.md`));
	return entry ? new TextEncoder().encode(entry[1]).length : 0;
}

/** Estimated reading time in minutes from a post's word count (~200 wpm). */
function readingMinutes(slug: string): number {
	const words = (getPostBody(slug) ?? '').split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 200));
}

/** Format an ISO date for display, e.g. "28 Jun 2026". */
export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
}
