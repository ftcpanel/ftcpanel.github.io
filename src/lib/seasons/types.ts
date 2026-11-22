export interface ComponentInfo {
	key: string;
	label: string;
	/** One-letter column header for narrow tables. */
	short: string;
}

export interface RpInfo {
	key: string;
	label: string;
}

export interface SeasonInfo {
	season: number;
	name: string;
	components: ComponentInfo[];
	rps: RpInfo[];
	/** Ranking points for a qualification win / tie; bonus RPs come from `rps`. */
	winRp: { win: number; tie: number };
	/** Labels of the per-match values averaged as tiebreakers after ranking score. */
	tiebreakers: string[];
}
