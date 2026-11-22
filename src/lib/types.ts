// Season-independent shapes the UI and models consume. Season adapters (src/lib/seasons)
// convert FTC Scout's season-typed unions into these.

import type { AllianceRole, TournamentLevel } from '#lib/api/gql/graphql.ts';

export type AllianceColor = 'red' | 'blue';

/** Scoring component keys are defined per season (e.g. auto / teleop / endgame). */
export type ComponentValues = Record<string, number>;

export interface AllianceScore {
	total: number;
	np: number;
	penaltyByOpp: number;
	components: ComponentValues;
	/** Ranking-point flags keyed by the season's RP keys. */
	rp: Record<string, boolean>;
	/** Season-specific raw breakdown rows for detail views: [label, points]. */
	breakdown: [string, number][];
	/** Per-match values averaged for ranking tiebreakers, in SeasonInfo.tiebreakers order. */
	tiebreakers: number[];
}

export interface MatchTeam {
	number: number;
	/** Playoff alliance role (Captain / FirstPick / SecondPick); 'Solo' or absent in quals. */
	role: AllianceRole;
	surrogate: boolean;
	noShow: boolean;
	dq: boolean;
}

export interface MatchAlliance {
	teams: MatchTeam[];
	score: AllianceScore | null;
}

export interface MatchRow {
	id: number;
	level: TournamentLevel;
	series: number;
	matchNum: number;
	/** Short label such as "Q12", "M3", "F1". */
	label: string;
	played: boolean;
	scheduledAt: string | null;
	postedAt: string | null;
	red: MatchAlliance;
	blue: MatchAlliance;
	winner: AllianceColor | 'tie' | null;
}

export interface TeamEventStats {
	rank: number;
	/** Ranking score as reported by FTC Scout. */
	rs: number;
	tb1: number;
	tb2: number;
	wins: number;
	losses: number;
	ties: number;
	played: number;
	oprNp: number;
	opr: ComponentValues;
	avgNp: number;
	avg: ComponentValues;
	maxNp: number;
	/** Average RP hit rate per RP key (0–1). */
	rpRate: Record<string, number>;
}

export interface RankingRow {
	team: number;
	name: string;
	location: string;
	stats: TeamEventStats | null;
}
