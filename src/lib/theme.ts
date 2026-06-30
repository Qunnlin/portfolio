/**
 * Theme registry + persistence.
 *
 * Theme tokens live in src/app.css under `[data-theme='<name>']`. This module is
 * the single list of valid names plus the helpers to apply / remember a choice,
 * so the terminal's `theme` command and the layout's startup code agree. A new
 * `[data-theme]` block in app.css must be added to this list too.
 */

export const themes = [
	'dark',
	'light',
	'gruvbox',
	'dracula',
	'nord',
	'tokyo-night',
	'catppuccin-mocha',
	'rose-pine',
	'solarized-dark',
	'solarized-light'
] as const;
export type Theme = (typeof themes)[number];

export const DEFAULT_THEME: Theme = 'dark';

const STORAGE_KEY = 'theme';

/** Type guard: is `name` one of the known themes? */
export function isTheme(name: string): name is Theme {
	return (themes as readonly string[]).includes(name);
}

/** Apply a theme to <html> and remember it. No-op during SSR. */
export function applyTheme(name: Theme): void {
	if (typeof document === 'undefined') return;
	document.documentElement.dataset.theme = name;
	try {
		localStorage.setItem(STORAGE_KEY, name);
	} catch {
		// localStorage can throw in private mode / when blocked — ignore.
	}
}

/** The remembered theme, or null if none/invalid. No-op during SSR. */
export function getStoredTheme(): Theme | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored && isTheme(stored) ? stored : null;
	} catch {
		return null;
	}
}
