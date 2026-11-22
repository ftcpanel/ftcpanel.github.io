const KEY = 'ftcpanel:my-team';

export interface MyTeam {
	number: number;
	name: string;
}

function load(): MyTeam | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
		return typeof raw?.number === 'number' && typeof raw?.name === 'string' ? raw : null;
	} catch {
		return null;
	}
}

class MyTeamStore {
	current = $state<MyTeam | null>(load());

	set(team: MyTeam | null) {
		this.current = team;
		if (team) localStorage.setItem(KEY, JSON.stringify(team));
		else localStorage.removeItem(KEY);
	}
}

/** The user's own team, stored on this device only (no accounts). */
export const myTeam = new MyTeamStore();
