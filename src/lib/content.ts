/**
 * Section content as data — the single source rendered BOTH by the styled pages
 * (as HTML) and by the terminal (as ASCII text). Keeping it here means the two
 * views can never disagree about what the site says.
 *
 * `renderSection`/`renderPost` produce terminal lines (figlet heading + text).
 * `aboutParagraphs` and `projects` are the raw data the styled `.svelte` pages
 * import and render their own way.
 */

import { figlet } from './banners';
import { site } from './site';
import { getPosts, getPostBody, formatDate } from './posts';
import type { TermLine, LineTone } from './terminal';

// ---- Raw content (imported by the styled pages too) ----

export const aboutParagraphs: string[] = [
	`Hi, I'm ${site.name_short} and welcome to my page. I'm happy to have you!`,
	`I am currently working as a full-stack developer with a strong interest in security engineering and applied AI. For my background: I hold a Master's degree in IT Security from TU Darmstadt, where I focused on network security, critical infrastructure, and ethical hacking.`,
	`During my studies, I had the privilege of exploring various areas of computer science and security, ranging from software engineering at a robotics startup to penetration testing, cloud security analysis, and research on post-quantum cryptography and secure communication protocols for embedded systems. I finally completed my Master's degree with a thesis on LLM-driven multi-agent exploitation frameworks for Android APKs. My professional experience spans internships and positions in security analysis, cloud computing, and embedded systems.`,
	`Today i work as a full-stack developer at genua GmbH, building secure and scalable applications for our customers. IT Security Software made in Germany if you will. I mainly work with Rust, Vue.js, and Kubernetes, but I also enjoy exploring new technologies and frameworks in my spare time. Like this site, which is built with SvelteKit, Bun, and UnoCSS.`,
	`If you want to get in touch, feel free to reach out via email or connect with me on LinkedIn. You can also explore my projects and blog posts to see some of the work I've done. Thanks for visiting!`
];

export interface Project {
	/** URL slug — used for /projects/<slug> and `cat <slug>` in the terminal. */
	slug: string;
	name: string;
	/** One-line summary shown in the listing. */
	desc: string;
	year?: string;
	/** Tech stack tags. */
	tech: string[];
	repo?: string;
	demo?: string;
	/** Optional longer description — one string per paragraph. */
	body?: string[];
}

export const projects: Project[] = [
	{
		slug: 'feinstaupp',
		name: 'Feinstaupp',
		desc: 'A visual analysis of Stuttgart’s air quality data, built with Vue.',
		year: '2020',
		tech: ['Vue', 'Node'],
		repo: 'https://github.com/qunnlin/feinstaupp',
		body: [
			"This project was built as part of my a university course on data visualization. It visualizes air quality data from Stuttgart, Germany, by using the city's open data API and displaying it in an interactive web application."
		]
	},
	{
		slug: 'gravewright',
		name: 'Gravewright',
		desc: 'GeekWeek vibe coding project: a roguelike dungeon crawler in the browser bhuilt with Anthropics Fable 5.',
		year: '2026',
		tech: ['TypeScript', 'Node'],
		repo: 'https://github.com/qunnlin/gravewright',
		body: [
			"This game was built during genua's GeekWeek hackathon, after hours, as a vibe-coding experiment — to explore what Claude (via Claude Code) is capable of, and to have some fun along the way.",
			"Full transparency: I have not written most of the productive code in this repository. My contribution is prompts, playtesting, direction and taste; the code itself was written by Claude Code, session by session. That's the experiment.",
			"And that's exactly why this matters to me: game developers — and software developers in general — are awesome. AI tools, Claude Code very much included, are amazing, but they are tools. They should support and amplify human creativity, never replace it. If anything, watching an AI assemble a small game in a few evenings deepens the respect for the people who design, build, balance and polish real games over years. This project has nothing on real game development — and it isn't trying to.",
		]
	},
	{
		slug: 'portfolio',
		name: 'Portfolio',
		desc: 'This very site, built with SvelteKit, Bun, and UnoCSS.',
		year: '2026',
		tech: ['SvelteKit', 'Bun', 'UnoCSS'],
		repo: 'https://github.com/qunnlin/portfolio',
		body: [
			"Well, you're on it..."
		]
	}

];

/**
 * Impressum (legal notice required in Germany, §5 DDG). A compliant Impressum
 * needs a reachable name + postal address + contact.
 */
// Email-only for now. Note: a German Impressum (§5 DDG) normally also needs a
// postal address — add a (non-home) one here if/when the site needs full compliance.
export const impressum = {
	name: site.name,
	email: site.email
};

/**
 * CV / résumé, rendered as a "git log" on the about page and the terminal.
 * Entries are newest-first. Skill `level` is 1–5 and renders as a block meter.
 */
export interface CvEntry {
	period: string;
	role: string;
	org: string;
	bullets?: string[];
	/** git refs/tags shown on the commit line, e.g. ['current']. */
	tags?: string[];
	/** Technologies — rendered as a git "stat" line under the commit. */
	tech?: string[];
}

export interface Skill {
	name: string;
	/** 1–5 proficiency. */
	level: number;
}

export const cv: {
	work: CvEntry[];
	education: CvEntry[];
	skills: Skill[];
	languages: string[];
	publications: { title: string; venue: string; url?: string }[];
} = {
	work: [
		{
			period: '2025 — now',
			role: 'Full-Stack Developer',
			org: 'genua GmbH',
			tags: ['current'],
			tech: ['Rust', 'Vue.js', 'Kubernetes'],
			
		},
		{
			period: 'Nov 2024 — Oct 2025',
			role: 'Master Thesis',
			org: 'Fraunhofer SIT',
			tags: ['msc-thesis'],
			tech: ['Python', 'Go', 'LangChain', 'AutoGen', 'Docker'],
			bullets: [
				'Built an LLM-driven multi-agent framework to automatically verify Android-app vulnerabilities found by an in-house scanner.',
				'Scalable tooling to process large APK datasets into structured validation results.'
			]
		},
		{
			period: 'Feb 2024 — Aug 2025',
			role: 'Working Student',
			org: 'usd AG',
			tech: ['Azure', 'M365', 'Prowler', 'Kali Linux', 'Python'],
			bullets: [
				'Cloud security analysis for Azure & M365 (CIS Benchmarks; Prowler, Steampipe).',
				'System & web pentests with the Kali toolchain; reported findings and mitigations.'
			]
		},
		{
			period: 'Apr 2022 — Feb 2023',
			role: 'Student Assistant',
			org: 'Fraunhofer SIT',
			tech: ['C', 'Embedded', 'Linux'],
			bullets: ['Implemented the LMN protocol in C for embedded smart-meter ↔ gateway comms (BSI spec).']
		},
		{
			period: 'May 2020 — Oct 2020',
			role: 'Intern & Bachelor Thesis',
			org: 'Robert Bosch GmbH',
			tags: ['bsc-thesis', 'published'],
			tech: ['C++', 'TPM', 'TLS', 'Post-Quantum Crypto'],
			bullets: ['Integrated TPM + post-quantum cryptography into TLS 1.2 for embedded/IoT; contributed to a publication.']
		},
		{
			period: 'May 2018 — Aug 2019',
			role: 'Working Student & Intern',
			org: 'Bosch Business Innovations',
			tech: ['C++', 'ROS', 'Python', 'LiDAR'],
			bullets: ['LiDAR detection/localization for an autonomous intralogistics robot — data toolchain, sensor drivers, Wi-Fi localization.']
		}
	],
	education: [
		{
			period: 'Mar 2026',
			role: 'M.Sc. IT Security',
			org: 'TU Darmstadt',
			tags: ['1.9'],
			bullets: ['Thesis: LLM-driven multi-agent exploitation framework for Android APKs.']
		},
		{
			period: '2023',
			role: 'M.Sc. IT Security (exchange)',
			org: 'Reichman University, Israel',
			tags: ['GPA 90.50'],
			bullets: ['Exchange semester: Focused on computer graphics & cloud computing.']
		},
		{
			period: 'Mar 2021',
			role: 'B.Sc. Computer Science',
			org: 'HfT Stuttgart',
			tags: ['2.0'],
			bullets: ['Thesis: TPM-based post-quantum cryptography for IoT.']
		}
	],
	// Proficiency levels are 1–5 (rendered as a block meter).
	skills: [
		{ name: 'Rust', level: 3 },
		{ name: 'JavaScript', level: 3 },
		{ name: 'Docker', level: 4 },
		{ name: 'Python', level: 4 },
		{ name: 'C / C++', level: 3 },
		{ name: 'Go', level: 1 },
		{ name: 'Agentic-LLM', level: 4 },
		{ name: 'Android Security', level: 4 },
		{ name: '(Kali-)Linux', level: 4 },
		{ name: 'Git', level: 4 }
	],
	languages: ['German - native', 'English - fluent'],
	publications: [
		{
			title:
				'TPM-Based Post-Quantum Cryptography: A Case Study on Quantum-Resistant Mutually Authenticated TLS for IoT',
			venue: 'ARES 2021',
			url: 'https://dl.acm.org/doi/10.1145/3465481.3465747'
		}
	]
};

const SKILL_LABELS = ['', 'learning', 'familiar', 'proficient', 'advanced', 'expert'];
const SKILL_BAR_WIDTH = 18;

/** Render a 1–5 skill level as a block meter (filled/empty bars + a word). */
export function skillMeter(level: number): { filled: string; empty: string; label: string } {
	const n = Math.max(0, Math.min(SKILL_BAR_WIDTH, Math.round((level / 5) * SKILL_BAR_WIDTH)));
	return {
		filled: '█'.repeat(n),
		empty: '░'.repeat(SKILL_BAR_WIDTH - n),
		label: SKILL_LABELS[level] ?? ''
	};
}

/** Stable 7-char pseudo commit hash from an entry (FNV-1a). */
export function entryHash(e: CvEntry): string {
	const s = e.period + e.org + e.role;
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

/** git ref/tag decoration for a commit line, e.g. " (HEAD -> career, tag: current)". */
export function entryRefs(e: CvEntry, isHead: boolean, branch: string): string {
	const refs = [...(isHead ? [`HEAD -> ${branch}`] : []), ...(e.tags ?? []).map((t) => `tag: ${t}`)];
	return refs.length ? `  (${refs.join(', ')})` : '';
}

/** All project slugs — used to enumerate prerender entries. */
export function getProjectSlugs(): string[] {
	return projects.map((p) => p.slug);
}

/** Look up a project by slug. */
export function getProject(slug: string): Project | undefined {
	return projects.find((p) => p.slug === slug);
}

// ---- Terminal rendering ----

const blank: TermLine = { text: '' };
const heading = (word: string): TermLine[] =>
	figlet(word).map((text) => ({ text, tone: 'green' as LineTone }));

/** Render a top-level section (by nav slug) as terminal lines. */
export function renderSection(slug: string): TermLine[] {
	switch (slug) {
		case 'about':
			return [
				...heading('about'),
				blank,
				...aboutParagraphs.map((text): TermLine => ({ text, tone: 'fg', wrap: true })),
				blank,
				...renderCv(),
				blank,
				{ text: 'try `ls`, `cd projects`, or `theme dracula`.', tone: 'dim' }
			];

		case 'projects': {
			const lines: TermLine[] = [...heading('projects'), blank];
			projects.forEach((p) => {
				lines.push({ text: `${p.name.padEnd(40)}${p.year ?? ''}`, tone: 'accent' });
				lines.push({ text: p.tech.map((t) => `[${t}]`).join(' '), tone: 'dim', wrap: true });
				lines.push({ text: p.desc, tone: 'fg', wrap: true });
				if (p.repo) lines.push({ text: `→ ${p.repo.replace(/^https?:\/\//, '')}`, tone: 'accent' });
				lines.push(blank);
			});
			lines.push({ text: 'open a project with `cat <name>` (e.g. `cat ' + projects[0].slug + '`).', tone: 'dim' });
			return lines;
		}

		case 'contact':
			return [
				...heading('contact'),
				blank,
				{ text: `email      ${site.email}`, tone: 'accent' },
				{ text: `github     github.com/${site.social.github}`, tone: 'accent' },
				{ text: `linkedin   linkedin.com/in/${site.social.linkedin}`, tone: 'accent' }
			];

		case 'blog': {
			const posts = getPosts();
			const lines: TermLine[] = [...heading('blog'), blank];
			if (posts.length === 0) {
				lines.push({ text: 'no posts yet.', tone: 'dim' });
				return lines;
			}
			posts.forEach((p, i) => {
				const tags = p.tags?.length ? '   ' + p.tags.map((t) => `#${t}`).join(' ') : '';
				lines.push({ text: `${i + 1} ● ${p.date}  ~${p.readingMinutes}m${tags}`, tone: 'dim', wrap: true });
				lines.push({ text: `    ${p.title}`, tone: 'yellow' });
				lines.push({ text: `    ${p.description}`, tone: 'fg', wrap: true });
				lines.push({ text: `    → cat ${p.slug}`, tone: 'accent' });
				lines.push(blank);
			});
			lines.push({ text: 'rss → /blog/rss.xml', tone: 'dim' });
			return lines;
		}

		case 'impressum':
			return [
				{ text: 'IMPRESSUM', tone: 'yellow' },
				{ text: '─'.repeat(9), tone: 'dim' },
				{ text: 'Angaben gemäß § 5 DDG', tone: 'dim' },
				blank,
				{ text: impressum.name, tone: 'fg' },
				{ text: `E-Mail: ${impressum.email}`, tone: 'accent' }
			];

		default:
			return [{ text: `nothing to render for "${slug}".`, tone: 'red' }];
	}
}

/** Render a single blog post body as terminal lines (basic markdown → text). */
export function renderPost(slug: string): TermLine[] {
	const meta = getPosts().find((p) => p.slug === slug);
	const body = getPostBody(slug);
	if (!meta || body === null) {
		return [{ text: `read: no such post: ${slug} — run \`cd blog\` to list posts.`, tone: 'red' }];
	}
	const tags = meta.tags?.length ? '  ' + meta.tags.map((t) => `#${t}`).join(' ') : '';
	return [
		{ text: meta.title.toUpperCase(), tone: 'yellow' },
		{ text: '─'.repeat(Math.min(meta.title.length, 48)), tone: 'dim' },
		{ text: `${formatDate(meta.date)} · ${meta.readingMinutes} min read${tags}`, tone: 'dim' },
		blank,
		...renderMarkdown(body),
		blank,
		{ text: '`cd blog` for the list.', tone: 'dim' }
	];
}

/** Render the CV as a `git log` for the terminal (used on the about screen). */
export function renderCv(): TermLine[] {
	const lines: TermLine[] = [];
	const author = `Author: ${site.name} <${site.email}>`;

	const log = (branch: string, entries: CvEntry[]) => {
		lines.push({ text: `$ git log ~/${branch}`, tone: 'green' });
		lines.push(blank);
		entries.forEach((e, i) => {
			lines.push({ text: `commit ${entryHash(e)}${entryRefs(e, i === 0, branch)}`, tone: 'yellow' });
			lines.push({ text: author, tone: 'dim' });
			lines.push({ text: `Date:   ${e.period}`, tone: 'dim' });
			lines.push(blank);
			lines.push({ text: `    ${e.role} · ${e.org}`, tone: 'fg' });
			(e.bullets ?? []).forEach((b) => lines.push({ text: `    • ${b}`, tone: 'dim', wrap: true }));
			if (e.tech?.length) lines.push({ text: `    [ ${e.tech.join('  ')} ]`, tone: 'green', wrap: true });
			// Vertical connector to the next commit (none after the last).
			lines.push({ text: i === entries.length - 1 ? '' : '│', tone: 'dim' });
		});
		lines.push(blank);
	};

	log('career', cv.work);
	log('education', cv.education);

	lines.push({ text: '$ skills --proficiency', tone: 'green' });
	lines.push(blank);
	for (const s of cv.skills) {
		const m = skillMeter(s.level);
		lines.push({ text: `${s.name.padEnd(18)} ${m.filled}${m.empty}  ${m.label}`, tone: 'accent' });
	}
	lines.push(blank);

	lines.push({ text: '$ cat ~/languages', tone: 'green' });
	lines.push({ text: cv.languages.join('   ·   '), tone: 'fg', wrap: true });
	lines.push(blank);

	lines.push({ text: '$ cat ~/publications', tone: 'green' });
	for (const p of cv.publications) {
		lines.push({ text: `• ${p.title}`, tone: 'fg', wrap: true });
		lines.push({
			text: `  ${p.venue}${p.url ? ' · ' + p.url.replace(/^https?:\/\//, '') : ''}`,
			tone: 'dim',
			wrap: true
		});
	}
	return lines;
}

/** Render a single project's detail as terminal lines. */
export function renderProject(slug: string): TermLine[] {
	const p = getProject(slug);
	if (!p) {
		return [{ text: `cat: no such project: ${slug} — run \`cd projects\` to list them.`, tone: 'red' }];
	}
	const lines: TermLine[] = [
		{ text: p.name.toUpperCase(), tone: 'yellow' },
		{ text: '─'.repeat(Math.min(p.name.length, 48)), tone: 'dim' }
	];
	if (p.year) lines.push({ text: p.year, tone: 'dim' });
	lines.push(blank, { text: p.desc, tone: 'fg', wrap: true }, blank);
	lines.push({ text: `stack:  ${p.tech.join(' · ')}`, tone: 'accent', wrap: true });
	if (p.repo) lines.push({ text: `repo:   ${p.repo.replace(/^https?:\/\//, '')}`, tone: 'accent' });
	if (p.demo) lines.push({ text: `demo:   ${p.demo.replace(/^https?:\/\//, '')}`, tone: 'accent' });
	if (p.body?.length) {
		lines.push(blank, ...p.body.map((t): TermLine => ({ text: stripInline(t), tone: 'fg', wrap: true })));
	}
	return lines;
}

/** Minimal markdown → terminal lines. Not a full parser — enough for posts. */
function renderMarkdown(md: string): TermLine[] {
	const out: TermLine[] = [];
	let inCode = false;
	for (const raw of md.split('\n')) {
		const fence = raw.trimStart().startsWith('```');
		if (fence) {
			inCode = !inCode;
			continue;
		}
		if (inCode) {
			out.push({ text: '  ' + raw, tone: 'green' }); // pre (keeps code shape)
			continue;
		}
		if (raw.trim() === '') {
			out.push(blank);
			continue;
		}
		const h = raw.match(/^(#{1,6})\s+(.*)$/);
		if (h) {
			out.push({ text: stripInline(h[2]).toUpperCase(), tone: 'yellow' });
			continue;
		}
		const li = raw.match(/^\s*[-*]\s+(.*)$/);
		if (li) {
			out.push({ text: '  • ' + stripInline(li[1]), tone: 'fg', wrap: true });
			continue;
		}
		out.push({ text: stripInline(raw), tone: 'fg', wrap: true });
	}
	return out;
}

/** Strip the most common inline markdown so plain text reads cleanly. */
function stripInline(s: string): string {
	return s
		.replace(/\*\*(.+?)\*\*/g, '$1')
		.replace(/\*(.+?)\*/g, '$1')
		.replace(/`(.+?)`/g, '$1')
		.replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)');
}
