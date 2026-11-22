import type { Alliance2026Fragment, TeamStatsFragment } from '#lib/api/gql/graphql.ts';
import type { AllianceScore, TeamEventStats } from '#lib/types.ts';
import type { SeasonInfo } from './types.ts';

type Stats2026 = Extract<TeamStatsFragment, { __typename: 'TeamEventStats2026' }>;
type Group2026 = Stats2026['opr'];

export const info: SeasonInfo = {
	season: 2026,
	name: 'BIOBUZZ',
	components: [
		{ key: 'auto', label: 'Auto', short: 'A' },
		{ key: 'teleop', label: 'Teleop', short: 'T' },
		{ key: 'endgame', label: 'Endgame', short: 'E' }
	],
	rps: [
		{ key: 'swarmRp', label: 'Swarm' },
		{ key: 'pollinator1Rp', label: 'Pollinator I' },
		{ key: 'pollinator2Rp', label: 'Pollinator II' }
	],
	// Verified against FTC Scout's rp/tb1/tb2 for 51 teams at two finished qualifiers:
	// RS = mean of (3 win / 1 tie + bonus RPs) over non-surrogate quals; TB1 = mean no-penalty
	// score; TB2 = mean tips. A DQ'd team gets 0 RP for that match (game manual; no DQs were in
	// the verification data).
	winRp: { win: 3, tie: 1 },
	tiebreakers: ['Avg score (no penalties)', 'Avg tips']
};

// Verified on 388 alliance scores: dcPoints = dcHive + dcFlower + dcGarden + dcPark,
// autoPoints + dcPoints = totalPointsNp, totalPointsNp + penaltyPointsByOpp = totalPoints.
function components(g: Pick<Group2026, 'autoPoints' | 'dcPoints' | 'dcParkPoints'>) {
	return { auto: g.autoPoints, teleop: g.dcPoints - g.dcParkPoints, endgame: g.dcParkPoints };
}

export function allianceScore(a: Alliance2026Fragment): AllianceScore {
	return {
		total: a.totalPoints,
		np: a.totalPointsNp,
		penaltyByOpp: a.penaltyPointsByOpp,
		components: components(a),
		rp: { swarmRp: a.swarmRp, pollinator1Rp: a.pollinator1Rp, pollinator2Rp: a.pollinator2Rp },
		breakdown: [
			['Auto leave', a.autoLeavePoints],
			['Auto park', a.autoParkPoints],
			['Auto hive', a.autoHivePoints],
			['Teleop hive', a.dcHivePoints],
			['Flowers', a.dcFlowerPoints],
			['Garden', a.dcGardenPoints],
			['Park', a.dcParkPoints]
		],
		tiebreakers: [a.totalPointsNp, a.tips]
	};
}

export function teamStats(s: Stats2026): TeamEventStats {
	return {
		rank: s.rank,
		rs: s.rp,
		tb1: s.tb1,
		tb2: s.tb2,
		wins: s.wins,
		losses: s.losses,
		ties: s.ties,
		played: s.qualMatchesPlayed,
		oprNp: s.opr.totalPointsNp,
		opr: components(s.opr),
		avgNp: s.avg.totalPointsNp,
		avg: components(s.avg),
		maxNp: s.max.totalPointsNp,
		rpRate: {
			swarmRp: s.avg.swarmRp,
			pollinator1Rp: s.avg.pollinator1Rp,
			pollinator2Rp: s.avg.pollinator2Rp
		}
	};
}
