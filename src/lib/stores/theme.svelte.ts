// Visual theme: 'simple' (default, all flat) or 'gradient' (page headers become gradient panels).
// Stored on this device; app.html applies it to <html data-theme> before first paint.

export type Theme = 'simple' | 'gradient';

const KEY = 'ftcpanel:theme';

class ThemeStore {
	current = $state<Theme>(
		typeof document !== 'undefined' && document.documentElement.dataset.theme === 'gradient' ? 'gradient' : 'simple'
	);

	set(theme: Theme) {
		this.current = theme;
		try {
			localStorage.setItem(KEY, theme);
		} catch {
			// Private mode: the choice lasts for this visit only.
		}
		if (theme === 'gradient') document.documentElement.dataset.theme = 'gradient';
		else delete document.documentElement.dataset.theme;
	}
}

export const theme = new ThemeStore();
