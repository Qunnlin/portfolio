// UnoCSS config: defines term-* theme colors and shortcuts that resolve to CSS variables.
import { defineConfig, presetUno, presetIcons, transformerDirectives } from 'unocss';

export default defineConfig({
	presets: [
		// Tailwind-compatible utilities (flex, gap-2, etc.).
		presetUno(),
		// On-demand icons — install icon sets later, e.g. `bun add -d @iconify-json/lucide`.
		presetIcons({ scale: 1.2 })
	],
	transformers: [
		// Enables @apply / @screen inside <style> blocks if you want it.
		transformerDirectives()
	],
	theme: {
		fontFamily: {
			mono: 'var(--font-mono)'
		},
		colors: {
			// These map onto CSS variables defined in app.css per [data-theme].
			// Swapping the theme (e.g. from the future terminal) reskins everything.
			term: {
				bg: 'var(--term-bg)',
				fg: 'var(--term-fg)',
				dim: 'var(--term-dim)',
				accent: 'var(--term-accent)',
				green: 'var(--term-green)',
				yellow: 'var(--term-yellow)',
				red: 'var(--term-red)',
				blue: 'var(--term-blue)',
				// Pre-mixed subtle divider (see --term-line in app.css).
				line: 'var(--term-line)'
			}
		}
	},
	shortcuts: {
		// One class for the terminal-prompt look, reused across the site.
		'term-link': 'text-term-accent underline-offset-4 hover:underline',
		'term-prompt': "before:content-['$_'] before:text-term-green"
	},
	// The terminal picks a text color per output line via a lookup map, so these
	// classes aren't statically visible to UnoCSS's scanner. Safelist them.
	safelist: [
		'text-term-fg',
		'text-term-dim',
		'text-term-green',
		'text-term-yellow',
		'text-term-red',
		'text-term-accent'
	]
});
