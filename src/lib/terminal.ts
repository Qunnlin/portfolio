/**
 * Terminal command engine.
 *
 * A command layer over the site tree: `ls` / `cd` / `tree` / `cat` all read `nav`
 * from $lib/site, so the terminal and the nav bar can never drift. It is
 * intentionally PURE — no DOM, no navigation,
 * no localStorage. `runCommand` returns lines to print plus an optional `action`;
 * the Svelte component performs the real side effects (goto, theme, clear). That
 * keeps this logic unit-testable and the component thin.
 */

import { site, resolve } from './site';
import { themes, isTheme, type Theme } from './theme';

export type LineTone = 'fg' | 'dim' | 'green' | 'yellow' | 'red' | 'accent';

export interface TermLine {
	text: string;
	tone?: LineTone;
	/** When true the line wraps (prose); otherwise it's rendered `white-space: pre`
	 *  so ASCII art and aligned columns keep their shape. */
	wrap?: boolean;
}

export type TermAction =
	| { type: 'navigate'; path: string }
	| { type: 'theme'; name: Theme }
	| { type: 'mode'; mode: 'gui' | 'terminal' }
	| { type: 'crt'; on: boolean }
	| { type: 'clear' };

/** One listing in the current "directory" (a section at root, or a post in /blog). */
export interface TermEntry {
	name: string;
	path: string;
	isDir?: boolean;
	desc?: string;
	/** Optional byte size for the `ls -al` listing (engine derives one if absent). */
	size?: number;
}

/** A node in the site tree, used by the `tree` command. */
export interface TreeNode {
	name: string;
	/** Route this node maps to — used to mark "you are here". */
	path?: string;
	children?: TreeNode[];
}

export interface TermContext {
	/** Current directory, e.g. '/' or '/projects'. */
	currentPath: string;
	/** Active theme name. */
	currentTheme: string;
	/** Whether the CRT effect is currently on (so `crt` can report the new state). */
	crt: boolean;
	/** Last-update date, preformatted for the `ls -al` date column. */
	date: string;
	/** Contents of the current directory — what `ls` lists and `cd`/`cat` resolve
	 *  against. Provided by the component (it knows the live route + posts). */
	entries: TermEntry[];
	/** The whole site as a tree, for `tree`. Provided by the component. */
	tree: TreeNode[];
}

export interface TermResult {
	lines: TermLine[];
	action?: TermAction;
}

const line = (text: string, tone?: LineTone): TermLine => ({ text, tone });

/** Strip a trailing slash from a `cd`/`cat` argument. */
function normalizeTarget(arg: string | undefined): string {
	return (arg ?? '').replace(/\/+$/, '');
}

/** Drop a .txt/.md extension so `cat about` and `cat about.txt` both match. */
function baseName(name: string): string {
	return name.replace(/\.(txt|md)$/, '');
}

/** Find an entry by name, extension-insensitively. */
function matchEntry(target: string, entries: TermEntry[]): TermEntry | undefined {
	const t = baseName(target);
	return entries.find((e) => baseName(e.name) === t);
}

/** The parent of a route path, e.g. '/blog/x' -> '/blog', '/blog' -> '/'. */
function parentPath(path: string): string {
	const segments = path.split('/').filter(Boolean);
	segments.pop();
	return '/' + segments.join('/');
}

/** Navigate to `path` and render its content. The component re-renders even when
 *  we're already there, so `cat`-ing the current file reprints it. */
function go(path: string): TermResult {
	return { lines: [line(`→ ${path}`, 'green')], action: { type: 'navigate', path } };
}

/** Deterministic, plausible byte size for a name (stable across renders). */
function psize(name: string): number {
	let h = 0;
	for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
	return 200 + (h % 9800);
}

/** Leave terminal mode for the styled view (gui/exit/quit all do this). */
function exitToGui(): TermResult {
	return {
		lines: [line('closing terminal — press / or the ›_ button to reopen.', 'green')],
		action: { type: 'mode', mode: 'gui' }
	};
}

interface Command {
	name: string;
	/** Extra names that invoke this same command (shown together in `help`). */
	aliases?: string[];
	usage?: string;
	desc: string;
	run(args: string[], ctx: TermContext): TermResult;
}

const COMMANDS: Command[] = [
	{
		name: 'help',
		desc: 'list available commands',
		run: () => ({
			lines: [
				line('available commands:', 'dim'),
				...COMMANDS.map((c) =>
					line(`  ${[c.name, ...(c.aliases ?? [])].join(', ').padEnd(12)} ${c.desc}`)
				),
				line(''),
				line('`ls` to look around, `cat <file>` to read, `cd blog` for posts.', 'dim')
			]
		})
	},
	{
		name: 'ls',
		usage: 'ls [-al]',
		desc: 'list the current directory (long format)',
		run: (_args, ctx) => {
			const owner = site.social.github;
			const row = (perms: string, links: number, size: number, name: string, tone?: LineTone) =>
				line(
					`${perms} ${String(links).padStart(2)} ${owner}  staff ${String(size).padStart(6)}  ${ctx.date} ${name}`,
					tone
				);
			const dirCount = ctx.entries.filter((e) => e.isDir).length;
			const lines: TermLine[] = [
				line(`total ${(ctx.entries.length + 2) * 8}`, 'dim'),
				row('drwxr-xr-x', dirCount + 2, 256, '.', 'dim'),
				row('drwxr-xr-x', 4, 256, '..', 'dim')
			];
			for (const e of ctx.entries) {
				lines.push(
					row(
						e.isDir ? 'drwxr-xr-x' : '-rw-r--r--',
						e.isDir ? 3 : 1,
						e.size ?? psize(e.name),
						e.name + (e.isDir ? '/' : ''),
						'accent'
					)
				);
			}
			return { lines };
		}
	},
	{
		name: 'cd',
		usage: 'cd <dir>',
		desc: 'change directory (cd blog, cd ..)',
		run: (args, ctx) => {
			const target = normalizeTarget(args[0]);
			if (target === '' || target === '~' || target === '/') return go('/');
			if (target === '..') return go(parentPath(ctx.currentPath));
			// Something in the current directory.
			const here = matchEntry(target, ctx.entries);
			if (here) {
				if (here.isDir) return go(here.path);
				return { lines: [line(`cd: not a directory: ${here.name} — try \`cat ${here.name}\``, 'red')] };
			}
			// A top-level directory, reachable from anywhere.
			const node = resolve(baseName(target));
			if (node) {
				if (node.isDir) return go(node.path);
				return { lines: [line(`cd: not a directory: ${node.slug} — try \`cat ${node.slug}.txt\``, 'red')] };
			}
			return { lines: [line(`cd: no such file or directory: ${args[0]}`, 'red')] };
		}
	},
	{
		name: 'cat',
		usage: 'cat <file>',
		desc: 'show a file (cat about.txt)',
		run: (args, ctx) => {
			const target = normalizeTarget(args[0]);
			if (!target) return { lines: [line('usage: cat <file> — run `ls` to see files', 'red')] };
			// A file in the current directory (e.g. a blog post).
			const here = matchEntry(target, ctx.entries);
			if (here) {
				if (!here.isDir) return go(here.path);
				return { lines: [line(`cat: ${here.name} is a directory — try \`ls ${here.name}\` or \`cd ${here.name}\``, 'red')] };
			}
			// A top-level file section (about/projects/contact), reachable from anywhere.
			const node = resolve(baseName(target));
			if (node) {
				if (!node.isDir) return go(node.path);
				return { lines: [line(`cat: ${node.slug} is a directory — try \`cd ${node.slug}\``, 'red')] };
			}
			return { lines: [line(`cat: no such file: ${args[0]}`, 'red')] };
		}
	},
	{
		name: 'tree',
		desc: 'show the whole site as a tree',
		run: (_args, ctx) => {
			const here = '  ← you are here';
			const lines: TermLine[] = [
				line(ctx.currentPath === '/' ? `.${here}` : '.', ctx.currentPath === '/' ? 'yellow' : 'dim')
			];
			const walk = (nodes: TreeNode[], prefix: string) => {
				nodes.forEach((n, i) => {
					const last = i === nodes.length - 1;
					// Only directories can be the cwd, so only mark dir nodes (the root is
					// handled above). This avoids double-marking about.txt, which lives at '/'.
					const atHere = n.children !== undefined && n.path === ctx.currentPath;
					lines.push(
						line(
							`${prefix}${last ? '└── ' : '├── '}${n.name}${atHere ? here : ''}`,
							atHere ? 'yellow' : n.children ? 'accent' : 'fg'
						)
					);
					if (n.children?.length) walk(n.children, prefix + (last ? '    ' : '│   '));
				});
			};
			walk(ctx.tree, '');
			return { lines };
		}
	},
	{
		name: 'theme',
		usage: 'theme [name]',
		desc: 'list or switch color theme',
		run: (args, ctx) => {
			if (!args[0]) {
				return {
					lines: [
						line('themes:', 'dim'),
						...themes.map((t) =>
							line(`  ${t}${t === ctx.currentTheme ? '  ← current' : ''}`, t === ctx.currentTheme ? 'green' : undefined)
						)
					]
				};
			}
			if (!isTheme(args[0])) {
				return { lines: [line(`theme: unknown theme '${args[0]}' (try: ${themes.join(', ')})`, 'red')] };
			}
			return {
				lines: [line(`theme → ${args[0]}`, 'green')],
				action: { type: 'theme', name: args[0] }
			};
		}
	},
	{
		name: 'whoami',
		desc: 'about me, in one line',
		run: () => ({
			lines: [line(`${site.name} — ${site.tagline}`, 'yellow')]
		})
	},
	{
		name: 'cv',
		aliases: ['resume'],
		desc: 'show my CV (the git log on the about screen)',
		run: () => go('/')
	},
	{
		name: 'pwd',
		desc: 'print the current path',
		run: (_args, ctx) => ({ lines: [line(ctx.currentPath)] })
	},
	{
		name: 'echo',
		usage: 'echo <text>',
		desc: 'print text',
		run: (args) => ({ lines: [line(args.join(' '))] })
	},
	{
		name: 'banner',
		desc: 'show the welcome banner',
		run: () => ({ lines: bannerLines() })
	},
	{
		name: 'gui',
		desc: 'switch to the styled (non-terminal) view',
		run: () => exitToGui()
	},
	{
		name: 'exit',
		aliases: ['quit'],
		desc: 'close the terminal',
		run: () => exitToGui()
	},
	{
		name: 'crt',
		usage: 'crt [on|off]',
		desc: 'toggle the retro CRT screen effect',
		run: (args, ctx) => {
			const arg = (args[0] ?? '').toLowerCase();
			const on = arg === 'on' ? true : arg === 'off' ? false : !ctx.crt; // no arg = toggle
			return {
				lines: [line(`CRT effect ${on ? 'on' : 'off'}`, on ? 'green' : 'dim')],
				action: { type: 'crt', on }
			};
		}
	},
	{
		name: 'clear',
		desc: 'clear the screen',
		run: () => ({ lines: [], action: { type: 'clear' } })
	},
	{
		name: 'sudo',
		desc: 'superuser do (nice try)',
		run: (args) => ({
			lines: [line(`sudo: ${args.join(' ') || 'permission'} denied — this is a portfolio, not a shell 🙂`, 'red')]
		})
	}
];

/** Command names, for tab-completion in the UI. */
export const commandNames: string[] = COMMANDS.flatMap((c) => [c.name, ...(c.aliases ?? [])]);

const FIGLET = [
	'  ______ ______ _      _____ __   __',
	' |  ____|  ____| |    |_   _|\\ \\ / /',
	' | |__  | |__  | |      | |   \\ V /',
	' |  __| |  __| | |      | |    > <',
	' | |    | |____| |____ _| |_  / . \\',
	' |_|    |______|______|_____|/_/ \\_\\'
];

/** The banner shown when the terminal opens. `meta` adds a login-style header. */
export function bannerLines(meta?: { lastLogin?: string; year?: string }): TermLine[] {
	const out: TermLine[] = [...FIGLET.map((l) => line(l, 'green')), line('')];
	out.push(line(`${site.name} — ${site.tagline}`, 'yellow'));
	if (meta?.lastLogin) out.push(line(`Last login: ${meta.lastLogin}`, 'dim'));
	out.push(line(`© ${meta?.year ? meta.year + ' ' : ''}${site.name}. All rights reserved.`, 'dim'));
	out.push(line('type `help` for commands, `ls` to look around, `cd <section>` to navigate.', 'dim'));
	out.push(line(''));
	return out;
}

/** Parse and execute a single input line. Pure: returns lines + optional action. */
export function runCommand(input: string, ctx: TermContext): TermResult {
	const trimmed = input.trim();
	if (!trimmed) return { lines: [] };
	const [name, ...args] = trimmed.split(/\s+/);
	const lower = name.toLowerCase();
	const cmd = COMMANDS.find((c) => c.name === lower || c.aliases?.includes(lower));
	if (!cmd) {
		return { lines: [line(`command not found: ${name} — type \`help\``, 'red')] };
	}
	return cmd.run(args, ctx);
}

/**
 * Tab-completion. Completes the command name, or its argument against the current
 * directory: `cd` → directories, `cat` → files, `theme` → theme names. Returns the
 * (possibly) completed input plus any ambiguous matches to display.
 */
export function completeInput(
	input: string,
	entries: TermEntry[]
): { completed: string; suggestions: string[] } {
	const endsWithSpace = /\s$/.test(input);
	const parts = input.trim().split(/\s+/).filter(Boolean);

	// Completing the command name (first token, nothing after it yet).
	if (parts.length <= 1 && !endsWithSpace) {
		const partial = parts[0] ?? '';
		const matches = commandNames.filter((c) => c.startsWith(partial));
		if (matches.length === 1) return { completed: matches[0] + ' ', suggestions: [] };
		return { completed: input, suggestions: matches };
	}

	// Completing an argument, by command.
	const cmd = parts[0];
	const partial = endsWithSpace ? '' : baseName(parts[parts.length - 1] ?? '');
	let pool: string[] = [];
	if (cmd === 'cd') pool = entries.filter((e) => e.isDir).map((e) => baseName(e.name));
	else if (cmd === 'cat') pool = entries.filter((e) => !e.isDir).map((e) => baseName(e.name));
	else if (cmd === 'theme') pool = [...themes];

	const matches = pool.filter((s) => s.startsWith(partial));
	if (matches.length === 1) return { completed: `${cmd} ${matches[0]}`, suggestions: [] };
	return { completed: input, suggestions: matches };
}
