/**
 * Single source of truth for the site structure.
 *
 * The nav bar, the sitemap, and the in-browser terminal all read from this tree:
 * `ls` lists these nodes, `cd about` runs goto(node.path), `tree` prints the whole
 * thing — no second source to keep in sync.
 */

export interface SiteNode {
	/** Path segment used by the terminal, e.g. `cd about`. */
	slug: string;
	/** Route to navigate to. */
	path: string;
	/** Label shown in nav. */
	title: string;
	/** One-liner used in sitemap / terminal `ls -l`. */
	blurb: string;
	/** Directory (listed/entered with `ls`/`cd`, like blog with its posts) vs.
	 *  single-page file (read with `cat`, like about/projects/contact). Drives the
	 *  terminal's verbs so the file/dir metaphor stays consistent everywhere. */
	isDir: boolean;
	/** Child nodes (e.g. blog posts under /blog), for future use. */
	children?: SiteNode[];
}

export const site = {
	name: 'Felix Schick',
	name_short: 'Felix',
	username: 'qunnlin',
	tagline: 'Security & backend engineer',
	/** One-line site description used as the default meta/OG description. */
	description:
		'IT-Security M.Sc. — security & backend engineering, applied AI, and a portfolio you can navigate as a terminal.',
	email: 'felix_schick@posteo.de',
	social: {
		github: 'qunnlin',
		linkedin: 'felixschick'
	}
};

/**
 * Absolute site origin, used for canonical/OpenGraph URLs, the sitemap, and the
 * RSS feed. Must be the full origin (protocol, no trailing slash) and match the
 * deployed domain. A plain constant works under prerendering with no env setup;
 * `$env/static/public` is an alternative.
 */
export const siteUrl = 'https://felixschick.dev';

export const nav: SiteNode[] = [
	{ slug: 'about', path: '/', title: 'about', blurb: 'who I am and what I do', isDir: false },
	{ slug: 'projects', path: '/projects', title: 'projects', blurb: 'things I have built', isDir: true },
	{ slug: 'blog', path: '/blog', title: 'blog', blurb: 'occasional writing', isDir: true },
	{ slug: 'contact', path: '/contact', title: 'contact', blurb: 'how to reach me', isDir: false }
];

/**
 * Legal pages (Impressum). Kept out of the main nav bar — linked from the footer
 * and reachable in the terminal — but still part of the routed, prerendered site.
 */
export const legal: SiteNode[] = [
	{ slug: 'impressum', path: '/impressum', title: 'Impressum', blurb: 'legal notice (§5 DDG)', isDir: false }
];

/** Look up a node (section or legal page) by its terminal slug, for `cd`/`cat`. */
export function resolve(slug: string): SiteNode | undefined {
	return [...nav, ...legal].find((n) => n.slug === slug);
}
