// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Build timestamp injected by Vite's `define` (see vite.config.ts), shown as the
	// terminal's "last login" / last-update date.
	const __BUILD_DATE__: string;
}

// mdsvex compiles each `.md` file to a Svelte component (default export) plus its
// parsed frontmatter (`metadata`). Typing the import here keeps posts.ts type-safe.
declare module '*.md' {
	import type { Component } from 'svelte';
	export const metadata: import('$lib/posts').PostMeta;
	const content: Component;
	export default content;
}

export {};
