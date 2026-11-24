import { graphql } from './gql/index.ts';

// Season-typed fragments. A new season adds `... on MatchScores20XX` / `... on TeamEventStats20XX`
// branches here plus a normalizer in src/lib/seasons.

graphql(`
	fragment Alliance2026 on MatchScores2026Alliance {
		totalPoints
		totalPointsNp
		penaltyPointsByOpp
		autoPoints
		autoLeavePoints
		autoParkPoints
		autoHivePoints
		dcPoints
		dcHivePoints
		dcFlowerPoints
		dcGardenPoints
		dcParkPoints
		swarmRp
		pollinator1Rp
		pollinator2Rp
		tips
		minorsCommitted
		majorsCommitted
	}
`);

graphql(`
	fragment StatGroup2026 on TeamEventStats2026Group {
		totalPointsNp
		autoPoints
		dcPoints
		dcParkPoints
		swarmRp
		pollinator1Rp
		pollinator2Rp
	}
`);

graphql(`
	fragment TeamStats on TeamEventStats {
		__typename
		... on TeamEventStats2026 {
			rank
			rp
			tb1
			tb2
			wins
			losses
			ties
			dqs
			qualMatchesPlayed
			opr {
				...StatGroup2026
			}
			avg {
				...StatGroup2026
			}
			max {
				totalPointsNp
			}
		}
	}
`);

graphql(`
	fragment MatchFields on Match {
		id
		tournamentLevel
		series
		matchNum
		description
		hasBeenPlayed
		scheduledStartTime
		actualStartTime
		postResultTime
		teams {
			teamNumber
			alliance
			station
			allianceRole
			surrogate
			noShow
			dq
		}
		scores {
			__typename
			... on MatchScores2026 {
				red {
					...Alliance2026
				}
				blue {
					...Alliance2026
				}
			}
		}
	}
`);

graphql(`
	fragment EventSummary on Event {
		season
		code
		name
		type
		start
		end
		started
		ongoing
		finished
		hasMatches
		remote
		location {
			city
			state
			country
		}
	}
`);

export const EventLiveQuery = graphql(`
	query EventLive($season: Int!, $code: String!) {
		eventByCode(season: $season, code: $code) {
			...EventSummary
			timezone
			liveStreamURL
			webcasts
			location {
				venue
			}
			teams {
				teamNumber
				team {
					name
					location {
						city
						state
						country
					}
				}
				stats {
					...TeamStats
				}
			}
			matches {
				...MatchFields
			}
			# Each team's stats from an earlier event: the matchup model's prior.
			previewStats {
				teamNumber
				stats {
					...TeamStats
				}
			}
		}
	}
`);

export const NewMatchesSubscription = graphql(`
	subscription NewMatches($season: Int!, $code: String!) {
		newMatches(season: $season, code: $code) {
			...MatchFields
		}
	}
`);

export const EventsWindowQuery = graphql(`
	query EventsWindow($season: Int!, $start: Date!, $end: Date!) {
		eventsSearch(season: $season, type: Competition, start: $start, end: $end) {
			...EventSummary
		}
	}
`);

/**
 * Every competition event of a season (~1.5k, ~40 KB gzipped), fetched once when the user searches.
 * Filtered locally (src/lib/search/events.ts): FTC Scout's own `searchText` ignores location.
 */
export const SeasonEventsQuery = graphql(`
	query SeasonEvents($season: Int!) {
		eventsSearch(season: $season, type: Competition) {
			...EventSummary
		}
	}
`);

/**
 * Team leaderboard page: team-event records by OPR (FTC Scout only sorts by total OPR here; nested
 * sort keys are ignored). A team appears once per event; `filterSkipRank` is its rank among unique
 * teams and is 0 on its weaker events, so keep rows with `filterSkipRank > 0`.
 */
export const LeaderboardQuery = graphql(`
	query Leaderboard($season: Int!, $region: RegionOption, $skip: Int!, $take: Int!) {
		tepRecords(season: $season, region: $region, sortBy: "opr.totalPointsNp", sortDir: Desc, skip: $skip, take: $take) {
			count
			offset
			data {
				filterSkipRank
				data {
					teamNumber
					eventCode
					team {
						name
						location {
							city
							state
							country
						}
					}
					event {
						name
						start
					}
					stats {
						...TeamStats
					}
				}
			}
		}
	}
`);

/** A team's matches this season with results (head-to-head in compare). */
export const TeamMatchesQuery = graphql(`
	query TeamMatches($number: Int!, $season: Int!) {
		teamByNumber(number: $number) {
			number
			matches(season: $season) {
				eventCode
				matchId
				alliance
				match {
					...MatchFields
				}
			}
		}
	}
`);

export const TeamSearchQuery = graphql(`
	query TeamSearch($text: String!) {
		teamsSearch(searchText: $text, limit: 8) {
			number
			name
			location {
				city
				state
				country
			}
		}
	}
`);

export const MyTeamQuery = graphql(`
	query MyTeam($number: Int!, $season: Int!) {
		teamByNumber(number: $number) {
			number
			name
			schoolName
			rookieYear
			location {
				city
				state
				country
			}
			quickStats(season: $season) {
				count
				tot {
					value
					rank
				}
				auto {
					value
					rank
				}
				dc {
					value
					rank
				}
				eg {
					value
					rank
				}
			}
			events(season: $season) {
				stats {
					...TeamStats
				}
				event {
					...EventSummary
					regionCode
					leagueCode
				}
			}
		}
	}
`);

/** Season OPR rank within the team's FIRST region and nation (both `RegionOption`s). */
export const TeamScopeRanksQuery = graphql(`
	query TeamScopeRanks($number: Int!, $season: Int!, $region: RegionOption!, $nation: RegionOption!) {
		teamByNumber(number: $number) {
			number
			region: quickStats(season: $season, region: $region) {
				count
				tot {
					rank
				}
			}
			nation: quickStats(season: $season, region: $nation) {
				count
				tot {
					rank
				}
			}
		}
	}
`);

/** League meets and tournaments in a region; filtered to one league client-side (no league argument). */
export const RegionLeagueEventsQuery = graphql(`
	query RegionLeagueEvents($season: Int!, $region: RegionOption!) {
		meets: eventsSearch(season: $season, region: $region, type: LeagueMeet) {
			code
			leagueCode
		}
		tournaments: eventsSearch(season: $season, region: $region, type: LeagueTournament) {
			code
			leagueCode
		}
	}
`);

/** Every team's stats at one event (league rank by OPR). */
export const EventTeamStatsQuery = graphql(`
	query EventTeamStats($season: Int!, $code: String!) {
		eventByCode(season: $season, code: $code) {
			code
			teams {
				teamNumber
				stats {
					...TeamStats
				}
			}
		}
	}
`);
