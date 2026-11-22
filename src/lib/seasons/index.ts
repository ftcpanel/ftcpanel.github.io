import type { MatchFieldsFragment, TeamStatsFragment, TournamentLevel } from '#lib/api/gql/graphql.ts';
import type { MatchAlliance, MatchRow, TeamEventStats } from '#lib/types.ts';
import * as s2026 from './2026.ts';
import type { SeasonInfo } from './types.ts';

export type { SeasonInfo } from './types.ts';

export const CURRENT_SEASON = 2026;

const seasons: Record<number, SeasonInfo> = { 2026: s2026.info };

export function seasonInfo(season: number): SeasonInfo {
	const info = seasons[season];
	if (!info) throw new Error(`Season ${season} is not supported`);
	return info;
}

export function isSupportedSeason(season: number): boolean {
	return season in seasons;
}

export function normalizeStats(stats: TeamStatsFragment | null): TeamEventStats | null {
	if (stats?.__typename === 'TeamEventStats2026') return s2026.teamStats(stats);
	return null;
}

const levelOrder: Record<TournamentLevel, number> = { Quals: 0, Semis: 1, DoubleElim: 1, Finals: 2 };

/** Play order: quals, then playoffs (semis / double-elim), then finals. */
export function compareMatches(a: MatchRow, b: MatchRow): number {
	return (
		levelOrder[a.level] - levelOrder[b.level] || a.series - b.series || a.matchNum - b.matchNum
	);
}

export function normalizeMatch(m: MatchFieldsFragment): MatchRow {
	const alliance = (color: 'Red' | 'Blue'): MatchAlliance => ({
		teams: m.teams
			.filter((t) => t.alliance === color)
			.sort((a, b) => a.station.localeCompare(b.station))
			.map((t) => ({ number: t.teamNumber, role: t.allianceRole, surrogate: t.surrogate, noShow: t.noShow, dq: t.dq })),
		score: null
	});
	const red = alliance('Red');
	const blue = alliance('Blue');
	if (m.hasBeenPlayed && m.scores?.__typename === 'MatchScores2026') {
		red.score = s2026.allianceScore(m.scores.red);
		blue.score = s2026.allianceScore(m.scores.blue);
	}
	let winner: MatchRow['winner'] = null;
	if (red.score && blue.score) {
		winner =
			red.score.total > blue.score.total ? 'red' : red.score.total < blue.score.total ? 'blue' : 'tie';
	}
	return {
		id: m.id,
		level: m.tournamentLevel,
		series: m.series,
		matchNum: m.matchNum,
		label: m.description.replace('-', '') || `#${m.id}`,
		played: m.hasBeenPlayed,
		scheduledAt: m.scheduledStartTime,
		postedAt: m.postResultTime,
		red,
		blue,
		winner
	};
}
