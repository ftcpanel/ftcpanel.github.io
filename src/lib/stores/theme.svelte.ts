// Visual theme: 'simple' (default, flat, no glass) or 'glass' (gradient page + liquid glass).
// Stored on this device; app.html applies it to <html data-theme> before first paint.

import { setGlassEnabled } from '#lib/glass/layer.ts';

export type Theme = 'simple' | 'glass';

export const THEME_KEY = 'ftcpanel:theme';

/** Browser chrome color per theme and color scheme (matches app.html's boot script). */
const THEME_COLOR: Record<Theme, { light: string; dark: string }> = {
	simple: { light: '#ffffff', dark: '#0e0e13' },
	glass: { light: '#2a5db5', dark: '#0a1124' }
};

function read(): Theme {
	return document.documentElement.dataset.theme === 'glass' ? 'glass' : 'simple';
}

class ThemeStore {
	current = $state<Theme>(typeof document === 'undefined' ? 'simple' : read());

	set(theme: Theme) {
		this.current = theme;
		try {
			localStorage.setItem(THEME_KEY, theme);
		} catch {
			// Private mode: the choice lasts for this visit only.
		}
		document.documentElement.dataset.theme = theme;
		for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
			meta.content = THEME_COLOR[theme][meta.media.includes('dark') ? 'dark' : 'light'];
		}
		setGlassEnabled(theme === 'glass');
	}
}

export const theme = new ThemeStore();
