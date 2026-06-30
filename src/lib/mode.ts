/**
 * View mode: `terminal` (the default — the whole screen is the terminal) or
 * `gui` (the styled pages). Persisted in localStorage and mirrored onto
 * `<html data-mode>` so CSS can hide the styled content in terminal mode before
 * paint (see app.css + the inline script in app.html). No-JS visitors never get
 * `data-mode`, so they always see the styled pages — which is the SEO/fallback.
 */

export type Mode = 'terminal' | 'gui';
export const DEFAULT_MODE: Mode = 'gui';

const STORAGE_KEY = 'mode';

export function getStoredMode(): Mode | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored === 'terminal' || stored === 'gui' ? stored : null;
	} catch {
		return null;
	}
}

/** Set the mode on <html> and remember it. No-op during SSR. */
export function applyMode(mode: Mode): void {
	if (typeof document === 'undefined') return;
	document.documentElement.dataset.mode = mode;
	try {
		localStorage.setItem(STORAGE_KEY, mode);
	} catch {
		// ignore (private mode / blocked storage)
	}
}
