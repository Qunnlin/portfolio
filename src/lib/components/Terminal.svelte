<!--
	The terminal — in terminal mode it IS the website (full screen).

	Terminal mode (default): the whole viewport is this terminal. It renders the
	current route's content as ASCII text (figlet heading + body) and `cd` both
	navigates the real route AND prints that section inline — without leaving it.
	`gui` switches to the styled pages; the launcher button / `/` open it again, Esc closes.

	The styled pages still render underneath (SSR'd, hidden via [data-mode] CSS in
	terminal mode) so links, SEO, and no-JS all keep working. All command parsing
	lives in $lib/terminal (pure, unit-tested); this component performs the
	actions (navigate / theme / mode / clear) and renders route content.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { nav, legal } from '$lib/site';
	import {
		runCommand,
		completeInput,
		bannerLines,
		type TermLine,
		type LineTone,
		type TermEntry,
		type TreeNode
	} from '$lib/terminal';
	import { renderSection, renderPost, renderProject, projects } from '$lib/content';
	import { getPosts, getPostSize } from '$lib/posts';

	// Real byte sizes for the `ls -al` size column.
	const byteLen = (s: string) => new TextEncoder().encode(s).length;
	const renderedSize = (lines: TermLine[]) => byteLen(lines.map((l) => l.text).join('\n'));
	import { applyTheme, getStoredTheme, DEFAULT_THEME, type Theme } from '$lib/theme';
	import { applyMode, getStoredMode, DEFAULT_MODE, type Mode } from '$lib/mode';

	let mode = $state<Mode>(DEFAULT_MODE);
	let crtOn = $state(false);
	let mounted = $state(false);
	let input = $state('');
	let lines = $state<TermLine[]>([]);
	let cmdHistory = $state<string[]>([]);
	let histIndex = $state<number | null>(null);
	let currentTheme = $state<Theme>(DEFAULT_THEME);

	// DOM refs. Svelte 5 wants bind:this targets that are read inside $effect to be
	// $state (the compiler warns otherwise) so the effects re-run once bound.
	let inputEl: HTMLInputElement | null = $state(null);
	let outputEl: HTMLDivElement | null = $state(null);
	// Bookkeeping for route-change rendering (non-reactive).
	let lastPath = '';

	const toneClass: Record<LineTone, string> = {
		fg: 'text-term-fg',
		dim: 'text-term-dim',
		green: 'text-term-green',
		yellow: 'text-term-yellow',
		red: 'text-term-red',
		accent: 'text-term-accent'
	};
	const colorOf = (t?: LineTone) => (t ? toneClass[t] : 'text-term-fg');

	// Build date, formatted for the `ls -al` date column (the site's last-update date).
	const lsDate = new Date(__BUILD_DATE__).toLocaleDateString('de-DE', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});

	/** The directory the user is "in". A *file* route resolves to its parent dir
	 *  (a file is read with `cat`, not `cd`-ed into), so /contact -> / and
	 *  /blog/<post> -> /blog. Only '/', '/blog' and '/projects' are directories. */
	function directoryOf(path: string): string {
		if (path === '/') return '/';
		const node = nav.find((n) => n.path === path);
		if (node?.isDir) return path;
		if (path.startsWith('/blog/')) return '/blog';
		if (path.startsWith('/projects/')) return '/projects';
		return '/';
	}
	const cwd = $derived(directoryOf(page.url.pathname));
	const prompt = $derived(`visitor@felix:~${cwd === '/' ? '' : cwd}$`);

	/** Lines for whatever route `path` points at (a section, a post, or a project). */
	function contentFor(path: string): TermLine[] {
		if (path.startsWith('/blog/')) {
			return renderPost(path.slice('/blog/'.length).replace(/\/$/, ''));
		}
		if (path.startsWith('/projects/')) {
			return renderProject(path.slice('/projects/'.length).replace(/\/$/, ''));
		}
		const node = [...nav, ...legal].find((n) => n.path === path);
		return node ? renderSection(node.slug) : [{ text: `no content for ${path}`, tone: 'dim' }];
	}

	/** Contents of directory `dir` — what `ls` lists and `cd`/`cat` resolve against:
	 *  root files+dirs, post files in /blog, project files in /projects. */
	function entriesFor(dir: string): TermEntry[] {
		if (dir === '/blog') {
			// Real .md file byte size.
			return getPosts().map((p) => ({
				name: `${p.slug}.md`,
				path: `/blog/${p.slug}`,
				isDir: false,
				desc: p.title,
				size: getPostSize(p.slug)
			}));
		}
		if (dir === '/projects') {
			// Byte size of the rendered project content.
			return projects.map((p) => ({
				name: p.slug,
				path: `/projects/${p.slug}`,
				isDir: false,
				desc: p.desc,
				size: renderedSize(renderProject(p.slug))
			}));
		}
		return [...nav, ...legal].map((n) => {
			// Files: byte size of their rendered content. Dirs: a metadata-style size
			// from the number of entries they contain.
			const childCount =
				n.slug === 'projects' ? projects.length : n.slug === 'blog' ? getPosts().length : 0;
			return {
				name: n.isDir ? n.slug : `${n.slug}.txt`,
				path: n.path,
				isDir: n.isDir,
				desc: n.blurb,
				size: n.isDir ? 64 + childCount * 64 : renderedSize(renderSection(n.slug))
			};
		});
	}

	/** The whole site as a tree (sections + nested posts/projects + legal), for `tree`. */
	function siteTree(): TreeNode[] {
		const sections = nav.map((n): TreeNode => {
			if (n.slug === 'projects') {
				return {
					name: 'projects/',
					path: '/projects',
					children: projects.map((p) => ({ name: p.slug, path: `/projects/${p.slug}` }))
				};
			}
			if (n.slug === 'blog') {
				return {
					name: 'blog/',
					path: '/blog',
					children: getPosts().map((p) => ({ name: `${p.slug}.md`, path: `/blog/${p.slug}` }))
				};
			}
			return { name: `${n.slug}.txt`, path: n.path };
		});
		return [...sections, ...legal.map((n) => ({ name: `${n.slug}.txt`, path: n.path }))];
	}

	/** Svelte action: clicking the node focuses the prompt (unless selecting text).
	 *  Done as an action so the listener is imperative — keeps the prompt typeable
	 *  without a non-interactive-element a11y warning. */
	function clickToFocus(node: HTMLElement) {
		const handler = () => {
			if (window.getSelection()?.toString()) return;
			inputEl?.focus();
		};
		node.addEventListener('click', handler);
		return { destroy: () => node.removeEventListener('click', handler) };
	}

	onMount(() => {
		const storedMode = getStoredMode();
		mode = storedMode ?? DEFAULT_MODE;
		applyMode(mode);

		const storedTheme = getStoredTheme();
		if (storedTheme) applyTheme(storedTheme);
		currentTheme = (document.documentElement.dataset.theme as Theme) || DEFAULT_THEME;

		try {
			crtOn = localStorage.getItem('crt') === '1';
		} catch {
			// ignore blocked storage
		}

		lastPath = page.url.pathname;
		lines = [...bannerLines(loginMeta()), ...contentFor(lastPath)];
		mounted = true;
	});

	/** "Last login" + © year from the build date (injected by Vite). */
	function loginMeta(): { lastLogin: string; year: string } {
		const d = new Date(__BUILD_DATE__);
		return {
			lastLogin: d.toLocaleString('en-GB', {
				weekday: 'short',
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			}),
			year: String(d.getFullYear())
		};
	}

	// When the route changes (e.g. via `cd`), append that section's content.
	// Only advance `lastPath` when we actually render (terminal mode); otherwise a
	// route change made in gui mode would desync lastPath and the next switch back
	// to terminal would skip rendering the new route.
	$effect(() => {
		const path = page.url.pathname;
		if (!mounted || path === lastPath) return;
		if (mode === 'terminal') {
			lastPath = path;
			lines = [...lines, ...contentFor(path)];
		}
	});

	// Focus the input while the terminal is showing.
	$effect(() => {
		if (mounted && mode === 'terminal' && inputEl) inputEl.focus();
	});

	// Keep the latest output in view.
	$effect(() => {
		lines.length;
		if (outputEl) outputEl.scrollTop = outputEl.scrollHeight;
	});

	function print(...newLines: TermLine[]) {
		lines = [...lines, ...newLines];
	}

	function enterMode(next: Mode) {
		mode = next;
		applyMode(next);
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const value = input;
		print({ text: `${prompt} ${value}`, tone: 'dim' });
		if (value.trim()) cmdHistory = [...cmdHistory, value];
		histIndex = null;

		// Read the live theme so a theme picked in the gui switcher is reflected here.
		const liveTheme =
			(typeof document !== 'undefined' && document.documentElement.dataset.theme) || currentTheme;
		// Commands operate relative to the current directory (cwd), not the file route.
		const result = runCommand(value, {
			currentPath: cwd,
			currentTheme: liveTheme,
			crt: crtOn,
			date: lsDate,
			entries: entriesFor(cwd),
			tree: siteTree()
		});
		print(...result.lines);
		input = '';

		const action = result.action;
		if (!action) return;
		if (action.type === 'clear') {
			lines = [];
		} else if (action.type === 'theme') {
			applyTheme(action.name);
			currentTheme = action.name;
		} else if (action.type === 'mode') {
			enterMode(action.mode);
		} else if (action.type === 'crt') {
			crtOn = action.on;
			try {
				localStorage.setItem('crt', crtOn ? '1' : '0');
			} catch {
				// ignore blocked storage
			}
		} else if (action.type === 'navigate') {
			if (action.path === page.url.pathname) {
				// Already here (e.g. `cat` of the current file) — reprint its content.
				lines = [...lines, ...contentFor(action.path)];
			} else {
				// keepFocus: SvelteKit otherwise moves focus to the page after nav,
				// which would kick the cursor out of the prompt.
				goto(action.path, { keepFocus: true }); // route effect renders the destination
			}
		}
	}

	function onInputKey(event: KeyboardEvent) {
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (!cmdHistory.length) return;
			histIndex = histIndex === null ? cmdHistory.length - 1 : Math.max(0, histIndex - 1);
			input = cmdHistory[histIndex];
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (histIndex === null) return;
			if (histIndex >= cmdHistory.length - 1) {
				histIndex = null;
				input = '';
			} else {
				histIndex += 1;
				input = cmdHistory[histIndex];
			}
		} else if (event.key === 'Tab') {
			event.preventDefault();
			const { completed, suggestions } = completeInput(input, entriesFor(cwd));
			if (completed !== input) {
				input = completed;
			} else if (suggestions.length) {
				print({ text: `${prompt} ${input}`, tone: 'dim' }, { text: suggestions.join('   '), tone: 'accent' });
			}
			inputEl?.focus(); // never let Tab move focus out of the prompt
		}
	}

	function onGlobalKey(event: KeyboardEvent) {
		// Open with `/` from the styled view; Esc closes. `/` is left alone inside the
		// terminal (it's used in paths like `cd /`) and in any other text field.
		if (event.key === '/' && mode !== 'terminal') {
			const target = event.target as HTMLElement | null;
			if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
			event.preventDefault();
			enterMode('terminal');
		} else if (event.key === 'Escape' && mode === 'terminal') {
			enterMode('gui');
		}
	}
</script>

<svelte:window onkeydown={onGlobalKey} />

{#if mounted}
	{#if mode === 'terminal'}
		<!-- use:clickToFocus keeps the prompt typeable after clicking anywhere in the
		     terminal (keyboard users get the focused input via the effect; ` / Esc are global). -->
		<section class="term-screen {crtOn ? 'crt' : ''}" aria-label="Site terminal" use:clickToFocus>
			<div class="output" bind:this={outputEl} aria-live="polite">
				{#each lines as l, i (i)}
					<div class="{colorOf(l.tone)} {l.wrap ? 'wrap' : ''}">{l.text || ' '}</div>
				{/each}
			</div>
			<form class="inputline" onsubmit={submit}>
				<span class="text-term-green shrink-0">{prompt}</span>
				<input
					bind:this={inputEl}
					bind:value={input}
					onkeydown={onInputKey}
					type="text"
					autocomplete="off"
					autocapitalize="off"
					autocorrect="off"
					spellcheck="false"
					aria-label="Terminal input"
				/>
			</form>
		</section>
	{:else}
		<button
			class="launcher"
			onclick={() => enterMode('terminal')}
			aria-label="Open terminal (press /)"
			title="Terminal — press /"
		>
			<span class="text-term-green">›_</span>&nbsp;terminal
		</button>
	{/if}
{/if}

<style>
	.term-screen {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		flex-direction: column;
		background: var(--term-bg);
		color: var(--term-fg);
	}

	/* CRT effect (toggle with `crt`): scanlines always; subtle flicker + glow only
	   when the user hasn't asked to reduce motion. pointer-events:none keeps it
	   from blocking input. */
	.term-screen.crt::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		/* Denser, darker scanlines + a vignette for a stronger CRT look. */
		background:
			repeating-linear-gradient(
				0deg,
				rgba(0, 0, 0, 0.28),
				rgba(0, 0, 0, 0.28) 1px,
				transparent 1px,
				transparent 2px
			),
			radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.35) 100%);
	}
	.term-screen.crt {
		text-shadow: 0 0 3px color-mix(in srgb, currentColor 60%, transparent);
	}

	@media (prefers-reduced-motion: no-preference) {
		.term-screen {
			animation: term-in 0.18s ease-out;
		}
		.term-screen.crt::after {
			animation: crt-flicker 4s ease-in-out infinite;
		}
		@keyframes term-in {
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}
		@keyframes crt-flicker {
			0%,
			100% {
				opacity: 1;
			}
			50% {
				opacity: 0.96;
			}
		}
	}

	.output {
		flex: 1;
		overflow-y: auto;
		overflow-x: auto; /* long pre lines (code, URLs, wide ASCII) scroll instead of overflowing */
		padding: 1.25rem clamp(1rem, 4vw, 3rem);
		font-size: 0.85rem;
		line-height: 1.5;
	}
	/* ASCII art / aligned columns keep their shape; prose lines wrap. */
	.output > div {
		white-space: pre;
	}
	.output > div.wrap {
		white-space: pre-wrap;
	}

	.inputline {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem clamp(1rem, 4vw, 3rem);
		border-top: 1px solid color-mix(in srgb, var(--term-dim) 30%, transparent);
	}
	.inputline input {
		flex: 1;
		min-width: 0;
		background: none;
		border: none;
		outline: none;
		color: var(--term-fg);
		font: inherit;
	}

	.launcher {
		position: fixed;
		right: 1rem;
		bottom: 1rem;
		z-index: 50;
		display: inline-flex;
		align-items: center;
		padding: 0.4rem 0.7rem;
		font: inherit;
		font-size: 0.8rem;
		color: var(--term-fg);
		background: color-mix(in srgb, var(--term-bg) 88%, transparent);
		border: 1px solid color-mix(in srgb, var(--term-dim) 40%, transparent);
		border-radius: 8px;
		cursor: pointer;
		backdrop-filter: blur(4px);
	}
	.launcher:hover {
		border-color: var(--term-green);
	}
</style>
