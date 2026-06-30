/// <reference types="bun" />
import { describe, it, expect } from 'bun:test';
import { runCommand, completeInput, commandNames, bannerLines } from './terminal';
import type { TermContext, TermEntry, TreeNode, TermResult } from './terminal';

const rootEntries: TermEntry[] = [
	{ name: 'about.txt', path: '/', isDir: false, desc: 'who I am' },
	{ name: 'projects', path: '/projects', isDir: true, desc: 'built' },
	{ name: 'blog', path: '/blog', isDir: true, desc: 'writing' },
	{ name: 'contact.txt', path: '/contact', isDir: false, desc: 'reach' }
];
const projEntries: TermEntry[] = [
	{ name: 'portfolio', path: '/projects/portfolio', isDir: false, desc: 'site' }
];
const postEntries: TermEntry[] = [
	{ name: 'why-mdsvex.md', path: '/blog/why-mdsvex', isDir: false, desc: 'post' }
];
const tree: TreeNode[] = [
	{ name: 'about.txt', path: '/' },
	{ name: 'projects/', path: '/projects', children: [{ name: 'portfolio', path: '/projects/portfolio' }] },
	{ name: 'blog/', path: '/blog', children: [{ name: 'why-mdsvex.md', path: '/blog/why-mdsvex' }] },
	{ name: 'contact.txt', path: '/contact' }
];

const mk = (path: string, entries: TermEntry[], crt = false): TermContext => ({
	currentPath: path,
	currentTheme: 'dark',
	crt,
	date: '29. Jun. 2026',
	entries,
	tree
});
const root = mk('/', rootEntries);
const txt = (r: TermResult) => r.lines.map((l) => l.text).join('\n');

describe('ls / cd / cat — the file/dir model', () => {
	it('ls is a long (ls -al style) listing with dirs marked /', () => {
		const out = txt(runCommand('ls', root));
		expect(out).toContain('projects/');
		expect(out).toContain('about.txt');
		expect(out).toContain('drwxr-xr-x'); // dir permissions
		expect(out).toContain('-rw-r--r--'); // file permissions
		expect(out).toContain('qunnlin'); // owner
		expect(out).toMatch(/^total \d+/m);
	});
	it('ls inside /blog lists posts, not the top-level pages', () => {
		const out = txt(runCommand('ls', mk('/blog', postEntries)));
		expect(out).toContain('why-mdsvex.md');
		expect(out).not.toContain('about');
	});
	it('cd into a directory navigates; cd into a file errors', () => {
		expect((runCommand('cd projects', root).action as { path: string }).path).toBe('/projects');
		const r = runCommand('cd about', root);
		expect(r.action).toBeUndefined();
		expect(txt(r)).toContain('not a directory');
	});
	it('cat a file navigates; cat a directory errors', () => {
		expect((runCommand('cat about.txt', root).action as { path: string }).path).toBe('/');
		expect(txt(runCommand('cat blog', root))).toContain('is a directory');
	});
	it('cat a project inside /projects opens its page', () => {
		const a = runCommand('cat portfolio', mk('/projects', projEntries)).action;
		expect((a as { path: string }).path).toBe('/projects/portfolio');
	});
	it('cd .. goes to the parent directory', () => {
		const a = runCommand('cd ..', mk('/blog/why-mdsvex', postEntries)).action;
		expect((a as { path: string }).path).toBe('/blog');
	});
});

describe('tree — nested + context-aware', () => {
	it('nests posts/projects under their folders', () => {
		const out = txt(runCommand('tree', root));
		expect(out).toContain('projects/');
		expect(out).toContain('portfolio'); // nested child
		expect(out).toContain('why-mdsvex.md');
	});
	it('marks the current folder with "you are here"', () => {
		expect(txt(runCommand('tree', root))).toContain('← you are here'); // at root
		const inProjects = txt(runCommand('tree', mk('/projects', projEntries)));
		expect(inProjects).toMatch(/projects\/.*← you are here/);
	});
});

describe('mode / theme / crt / clear', () => {
	it('gui, exit, and the quit alias all leave terminal mode', () => {
		for (const cmd of ['gui', 'exit', 'quit']) {
			const a = runCommand(cmd, root).action;
			expect(a?.type).toBe('mode');
			expect((a as { mode: string }).mode).toBe('gui');
		}
	});
	it('crt reports the resulting state (on/off), respecting ctx.crt for toggle', () => {
		const onR = runCommand('crt', mk('/', rootEntries, false));
		expect((onR.action as { on: boolean }).on).toBe(true);
		expect(txt(onR)).toContain('CRT effect on');
		const offR = runCommand('crt', mk('/', rootEntries, true));
		expect((offR.action as { on: boolean }).on).toBe(false);
		expect(txt(offR)).toContain('CRT effect off');
		expect((runCommand('crt off', mk('/', rootEntries, true)).action as { on: boolean }).on).toBe(false);
	});
	it('cv and its resume alias jump to the about screen', () => {
		expect((runCommand('cv', root).action as { path: string }).path).toBe('/');
		expect((runCommand('resume', root).action as { path: string }).path).toBe('/');
	});
	it('theme switches; unknown errors; clear clears', () => {
		expect((runCommand('theme light', root).action as { name: string }).name).toBe('light');
		expect(txt(runCommand('theme nope', root))).toContain('unknown');
		expect(runCommand('clear', root).action?.type).toBe('clear');
	});
});

describe('parsing, help, banner, completion', () => {
	it('unknown command reports not found; empty input does nothing', () => {
		expect(txt(runCommand('frobnicate', root))).toContain('command not found');
		expect(runCommand('   ', root).lines.length).toBe(0);
	});
	it('help lists every command, with quit shown alongside exit', () => {
		const out = txt(runCommand('help', root));
		for (const name of commandNames) expect(out).toContain(name);
		expect(out).toContain('exit, quit');
	});
	it('bannerLines renders the figlet and includes login meta when given', () => {
		expect(bannerLines()[0].tone).toBe('green');
		const out = bannerLines({ lastLogin: 'Mon 29 Jun 2026, 14:00', year: '2026' })
			.map((l) => l.text)
			.join('\n');
		expect(out).toContain('Last login: Mon 29 Jun 2026, 14:00');
		expect(out).toContain('© 2026');
	});
	it('completes commands and dir/file/theme arguments', () => {
		expect(completeInput('he', []).completed.trim()).toBe('help');
		expect(completeInput('cd pro', rootEntries).completed).toBe('cd projects');
		expect(completeInput('cd ab', rootEntries).completed).toBe('cd ab'); // about is a file
		expect(completeInput('cat why', postEntries).completed).toBe('cat why-mdsvex');
		expect(completeInput('theme dr', []).completed).toBe('theme dracula');
	});
});
