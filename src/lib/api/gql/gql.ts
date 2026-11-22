/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n\tfragment Alliance2026 on MatchScores2026Alliance {\n\t\ttotalPoints\n\t\ttotalPointsNp\n\t\tpenaltyPointsByOpp\n\t\tautoPoints\n\t\tautoLeavePoints\n\t\tautoParkPoints\n\t\tautoHivePoints\n\t\tdcPoints\n\t\tdcHivePoints\n\t\tdcFlowerPoints\n\t\tdcGardenPoints\n\t\tdcParkPoints\n\t\tswarmRp\n\t\tpollinator1Rp\n\t\tpollinator2Rp\n\t\ttips\n\t\tminorsCommitted\n\t\tmajorsCommitted\n\t}\n": typeof types.Alliance2026FragmentDoc,
    "\n\tfragment StatGroup2026 on TeamEventStats2026Group {\n\t\ttotalPointsNp\n\t\tautoPoints\n\t\tdcPoints\n\t\tdcParkPoints\n\t\tswarmRp\n\t\tpollinator1Rp\n\t\tpollinator2Rp\n\t}\n": typeof types.StatGroup2026FragmentDoc,
    "\n\tfragment TeamStats on TeamEventStats {\n\t\t__typename\n\t\t... on TeamEventStats2026 {\n\t\t\trank\n\t\t\trp\n\t\t\ttb1\n\t\t\ttb2\n\t\t\twins\n\t\t\tlosses\n\t\t\tties\n\t\t\tdqs\n\t\t\tqualMatchesPlayed\n\t\t\topr {\n\t\t\t\t...StatGroup2026\n\t\t\t}\n\t\t\tavg {\n\t\t\t\t...StatGroup2026\n\t\t\t}\n\t\t\tmax {\n\t\t\t\ttotalPointsNp\n\t\t\t}\n\t\t}\n\t}\n": typeof types.TeamStatsFragmentDoc,
    "\n\tfragment MatchFields on Match {\n\t\tid\n\t\ttournamentLevel\n\t\tseries\n\t\tmatchNum\n\t\tdescription\n\t\thasBeenPlayed\n\t\tscheduledStartTime\n\t\tactualStartTime\n\t\tpostResultTime\n\t\tteams {\n\t\t\tteamNumber\n\t\t\talliance\n\t\t\tstation\n\t\t\tallianceRole\n\t\t\tsurrogate\n\t\t\tnoShow\n\t\t\tdq\n\t\t}\n\t\tscores {\n\t\t\t__typename\n\t\t\t... on MatchScores2026 {\n\t\t\t\tred {\n\t\t\t\t\t...Alliance2026\n\t\t\t\t}\n\t\t\t\tblue {\n\t\t\t\t\t...Alliance2026\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": typeof types.MatchFieldsFragmentDoc,
    "\n\tfragment EventSummary on Event {\n\t\tseason\n\t\tcode\n\t\tname\n\t\ttype\n\t\tstart\n\t\tend\n\t\tstarted\n\t\tongoing\n\t\tfinished\n\t\thasMatches\n\t\tremote\n\t\tlocation {\n\t\t\tcity\n\t\t\tstate\n\t\t\tcountry\n\t\t}\n\t}\n": typeof types.EventSummaryFragmentDoc,
    "\n\tquery EventLive($season: Int!, $code: String!) {\n\t\teventByCode(season: $season, code: $code) {\n\t\t\t...EventSummary\n\t\t\ttimezone\n\t\t\tliveStreamURL\n\t\t\twebcasts\n\t\t\tlocation {\n\t\t\t\tvenue\n\t\t\t}\n\t\t\tteams {\n\t\t\t\tteamNumber\n\t\t\t\tteam {\n\t\t\t\t\tname\n\t\t\t\t\tlocation {\n\t\t\t\t\t\tcity\n\t\t\t\t\t\tstate\n\t\t\t\t\t\tcountry\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tstats {\n\t\t\t\t\t...TeamStats\n\t\t\t\t}\n\t\t\t}\n\t\t\tmatches {\n\t\t\t\t...MatchFields\n\t\t\t}\n\t\t\t# Each team's stats from an earlier event: the matchup model's prior.\n\t\t\tpreviewStats {\n\t\t\t\tteamNumber\n\t\t\t\tstats {\n\t\t\t\t\t...TeamStats\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": typeof types.EventLiveDocument,
    "\n\tsubscription NewMatches($season: Int!, $code: String!) {\n\t\tnewMatches(season: $season, code: $code) {\n\t\t\t...MatchFields\n\t\t}\n\t}\n": typeof types.NewMatchesDocument,
    "\n\tquery EventsWindow($season: Int!, $start: Date!, $end: Date!) {\n\t\teventsSearch(season: $season, type: Competition, start: $start, end: $end) {\n\t\t\t...EventSummary\n\t\t}\n\t}\n": typeof types.EventsWindowDocument,
    "\n\tquery EventsSearch($season: Int!, $text: String!) {\n\t\teventsSearch(season: $season, type: Competition, searchText: $text, limit: 30) {\n\t\t\t...EventSummary\n\t\t}\n\t}\n": typeof types.EventsSearchDocument,
    "\n\tquery TeamSearch($text: String!) {\n\t\tteamsSearch(searchText: $text, limit: 8) {\n\t\t\tnumber\n\t\t\tname\n\t\t\tlocation {\n\t\t\t\tcity\n\t\t\t\tstate\n\t\t\t\tcountry\n\t\t\t}\n\t\t}\n\t}\n": typeof types.TeamSearchDocument,
    "\n\tquery MyTeam($number: Int!, $season: Int!) {\n\t\tteamByNumber(number: $number) {\n\t\t\tnumber\n\t\t\tname\n\t\t\tschoolName\n\t\t\trookieYear\n\t\t\tlocation {\n\t\t\t\tcity\n\t\t\t\tstate\n\t\t\t\tcountry\n\t\t\t}\n\t\t\tquickStats(season: $season) {\n\t\t\t\tcount\n\t\t\t\ttot {\n\t\t\t\t\tvalue\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t\tauto {\n\t\t\t\t\tvalue\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t\tdc {\n\t\t\t\t\tvalue\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t\teg {\n\t\t\t\t\tvalue\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t}\n\t\t\tevents(season: $season) {\n\t\t\t\tstats {\n\t\t\t\t\t...TeamStats\n\t\t\t\t}\n\t\t\t\tevent {\n\t\t\t\t\t...EventSummary\n\t\t\t\t\tregionCode\n\t\t\t\t\tleagueCode\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": typeof types.MyTeamDocument,
    "\n\tquery TeamScopeRanks($number: Int!, $season: Int!, $region: RegionOption!, $nation: RegionOption!) {\n\t\tteamByNumber(number: $number) {\n\t\t\tnumber\n\t\t\tregion: quickStats(season: $season, region: $region) {\n\t\t\t\tcount\n\t\t\t\ttot {\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t}\n\t\t\tnation: quickStats(season: $season, region: $nation) {\n\t\t\t\tcount\n\t\t\t\ttot {\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": typeof types.TeamScopeRanksDocument,
    "\n\tquery RegionLeagueEvents($season: Int!, $region: RegionOption!) {\n\t\tmeets: eventsSearch(season: $season, region: $region, type: LeagueMeet) {\n\t\t\tcode\n\t\t\tleagueCode\n\t\t}\n\t\ttournaments: eventsSearch(season: $season, region: $region, type: LeagueTournament) {\n\t\t\tcode\n\t\t\tleagueCode\n\t\t}\n\t}\n": typeof types.RegionLeagueEventsDocument,
    "\n\tquery EventTeamStats($season: Int!, $code: String!) {\n\t\teventByCode(season: $season, code: $code) {\n\t\t\tcode\n\t\t\tteams {\n\t\t\t\tteamNumber\n\t\t\t\tstats {\n\t\t\t\t\t...TeamStats\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": typeof types.EventTeamStatsDocument,
};
const documents: Documents = {
    "\n\tfragment Alliance2026 on MatchScores2026Alliance {\n\t\ttotalPoints\n\t\ttotalPointsNp\n\t\tpenaltyPointsByOpp\n\t\tautoPoints\n\t\tautoLeavePoints\n\t\tautoParkPoints\n\t\tautoHivePoints\n\t\tdcPoints\n\t\tdcHivePoints\n\t\tdcFlowerPoints\n\t\tdcGardenPoints\n\t\tdcParkPoints\n\t\tswarmRp\n\t\tpollinator1Rp\n\t\tpollinator2Rp\n\t\ttips\n\t\tminorsCommitted\n\t\tmajorsCommitted\n\t}\n": types.Alliance2026FragmentDoc,
    "\n\tfragment StatGroup2026 on TeamEventStats2026Group {\n\t\ttotalPointsNp\n\t\tautoPoints\n\t\tdcPoints\n\t\tdcParkPoints\n\t\tswarmRp\n\t\tpollinator1Rp\n\t\tpollinator2Rp\n\t}\n": types.StatGroup2026FragmentDoc,
    "\n\tfragment TeamStats on TeamEventStats {\n\t\t__typename\n\t\t... on TeamEventStats2026 {\n\t\t\trank\n\t\t\trp\n\t\t\ttb1\n\t\t\ttb2\n\t\t\twins\n\t\t\tlosses\n\t\t\tties\n\t\t\tdqs\n\t\t\tqualMatchesPlayed\n\t\t\topr {\n\t\t\t\t...StatGroup2026\n\t\t\t}\n\t\t\tavg {\n\t\t\t\t...StatGroup2026\n\t\t\t}\n\t\t\tmax {\n\t\t\t\ttotalPointsNp\n\t\t\t}\n\t\t}\n\t}\n": types.TeamStatsFragmentDoc,
    "\n\tfragment MatchFields on Match {\n\t\tid\n\t\ttournamentLevel\n\t\tseries\n\t\tmatchNum\n\t\tdescription\n\t\thasBeenPlayed\n\t\tscheduledStartTime\n\t\tactualStartTime\n\t\tpostResultTime\n\t\tteams {\n\t\t\tteamNumber\n\t\t\talliance\n\t\t\tstation\n\t\t\tallianceRole\n\t\t\tsurrogate\n\t\t\tnoShow\n\t\t\tdq\n\t\t}\n\t\tscores {\n\t\t\t__typename\n\t\t\t... on MatchScores2026 {\n\t\t\t\tred {\n\t\t\t\t\t...Alliance2026\n\t\t\t\t}\n\t\t\t\tblue {\n\t\t\t\t\t...Alliance2026\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": types.MatchFieldsFragmentDoc,
    "\n\tfragment EventSummary on Event {\n\t\tseason\n\t\tcode\n\t\tname\n\t\ttype\n\t\tstart\n\t\tend\n\t\tstarted\n\t\tongoing\n\t\tfinished\n\t\thasMatches\n\t\tremote\n\t\tlocation {\n\t\t\tcity\n\t\t\tstate\n\t\t\tcountry\n\t\t}\n\t}\n": types.EventSummaryFragmentDoc,
    "\n\tquery EventLive($season: Int!, $code: String!) {\n\t\teventByCode(season: $season, code: $code) {\n\t\t\t...EventSummary\n\t\t\ttimezone\n\t\t\tliveStreamURL\n\t\t\twebcasts\n\t\t\tlocation {\n\t\t\t\tvenue\n\t\t\t}\n\t\t\tteams {\n\t\t\t\tteamNumber\n\t\t\t\tteam {\n\t\t\t\t\tname\n\t\t\t\t\tlocation {\n\t\t\t\t\t\tcity\n\t\t\t\t\t\tstate\n\t\t\t\t\t\tcountry\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tstats {\n\t\t\t\t\t...TeamStats\n\t\t\t\t}\n\t\t\t}\n\t\t\tmatches {\n\t\t\t\t...MatchFields\n\t\t\t}\n\t\t\t# Each team's stats from an earlier event: the matchup model's prior.\n\t\t\tpreviewStats {\n\t\t\t\tteamNumber\n\t\t\t\tstats {\n\t\t\t\t\t...TeamStats\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": types.EventLiveDocument,
    "\n\tsubscription NewMatches($season: Int!, $code: String!) {\n\t\tnewMatches(season: $season, code: $code) {\n\t\t\t...MatchFields\n\t\t}\n\t}\n": types.NewMatchesDocument,
    "\n\tquery EventsWindow($season: Int!, $start: Date!, $end: Date!) {\n\t\teventsSearch(season: $season, type: Competition, start: $start, end: $end) {\n\t\t\t...EventSummary\n\t\t}\n\t}\n": types.EventsWindowDocument,
    "\n\tquery EventsSearch($season: Int!, $text: String!) {\n\t\teventsSearch(season: $season, type: Competition, searchText: $text, limit: 30) {\n\t\t\t...EventSummary\n\t\t}\n\t}\n": types.EventsSearchDocument,
    "\n\tquery TeamSearch($text: String!) {\n\t\tteamsSearch(searchText: $text, limit: 8) {\n\t\t\tnumber\n\t\t\tname\n\t\t\tlocation {\n\t\t\t\tcity\n\t\t\t\tstate\n\t\t\t\tcountry\n\t\t\t}\n\t\t}\n\t}\n": types.TeamSearchDocument,
    "\n\tquery MyTeam($number: Int!, $season: Int!) {\n\t\tteamByNumber(number: $number) {\n\t\t\tnumber\n\t\t\tname\n\t\t\tschoolName\n\t\t\trookieYear\n\t\t\tlocation {\n\t\t\t\tcity\n\t\t\t\tstate\n\t\t\t\tcountry\n\t\t\t}\n\t\t\tquickStats(season: $season) {\n\t\t\t\tcount\n\t\t\t\ttot {\n\t\t\t\t\tvalue\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t\tauto {\n\t\t\t\t\tvalue\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t\tdc {\n\t\t\t\t\tvalue\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t\teg {\n\t\t\t\t\tvalue\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t}\n\t\t\tevents(season: $season) {\n\t\t\t\tstats {\n\t\t\t\t\t...TeamStats\n\t\t\t\t}\n\t\t\t\tevent {\n\t\t\t\t\t...EventSummary\n\t\t\t\t\tregionCode\n\t\t\t\t\tleagueCode\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": types.MyTeamDocument,
    "\n\tquery TeamScopeRanks($number: Int!, $season: Int!, $region: RegionOption!, $nation: RegionOption!) {\n\t\tteamByNumber(number: $number) {\n\t\t\tnumber\n\t\t\tregion: quickStats(season: $season, region: $region) {\n\t\t\t\tcount\n\t\t\t\ttot {\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t}\n\t\t\tnation: quickStats(season: $season, region: $nation) {\n\t\t\t\tcount\n\t\t\t\ttot {\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": types.TeamScopeRanksDocument,
    "\n\tquery RegionLeagueEvents($season: Int!, $region: RegionOption!) {\n\t\tmeets: eventsSearch(season: $season, region: $region, type: LeagueMeet) {\n\t\t\tcode\n\t\t\tleagueCode\n\t\t}\n\t\ttournaments: eventsSearch(season: $season, region: $region, type: LeagueTournament) {\n\t\t\tcode\n\t\t\tleagueCode\n\t\t}\n\t}\n": types.RegionLeagueEventsDocument,
    "\n\tquery EventTeamStats($season: Int!, $code: String!) {\n\t\teventByCode(season: $season, code: $code) {\n\t\t\tcode\n\t\t\tteams {\n\t\t\t\tteamNumber\n\t\t\t\tstats {\n\t\t\t\t\t...TeamStats\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": types.EventTeamStatsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment Alliance2026 on MatchScores2026Alliance {\n\t\ttotalPoints\n\t\ttotalPointsNp\n\t\tpenaltyPointsByOpp\n\t\tautoPoints\n\t\tautoLeavePoints\n\t\tautoParkPoints\n\t\tautoHivePoints\n\t\tdcPoints\n\t\tdcHivePoints\n\t\tdcFlowerPoints\n\t\tdcGardenPoints\n\t\tdcParkPoints\n\t\tswarmRp\n\t\tpollinator1Rp\n\t\tpollinator2Rp\n\t\ttips\n\t\tminorsCommitted\n\t\tmajorsCommitted\n\t}\n"): typeof import('./graphql').Alliance2026FragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment StatGroup2026 on TeamEventStats2026Group {\n\t\ttotalPointsNp\n\t\tautoPoints\n\t\tdcPoints\n\t\tdcParkPoints\n\t\tswarmRp\n\t\tpollinator1Rp\n\t\tpollinator2Rp\n\t}\n"): typeof import('./graphql').StatGroup2026FragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment TeamStats on TeamEventStats {\n\t\t__typename\n\t\t... on TeamEventStats2026 {\n\t\t\trank\n\t\t\trp\n\t\t\ttb1\n\t\t\ttb2\n\t\t\twins\n\t\t\tlosses\n\t\t\tties\n\t\t\tdqs\n\t\t\tqualMatchesPlayed\n\t\t\topr {\n\t\t\t\t...StatGroup2026\n\t\t\t}\n\t\t\tavg {\n\t\t\t\t...StatGroup2026\n\t\t\t}\n\t\t\tmax {\n\t\t\t\ttotalPointsNp\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').TeamStatsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment MatchFields on Match {\n\t\tid\n\t\ttournamentLevel\n\t\tseries\n\t\tmatchNum\n\t\tdescription\n\t\thasBeenPlayed\n\t\tscheduledStartTime\n\t\tactualStartTime\n\t\tpostResultTime\n\t\tteams {\n\t\t\tteamNumber\n\t\t\talliance\n\t\t\tstation\n\t\t\tallianceRole\n\t\t\tsurrogate\n\t\t\tnoShow\n\t\t\tdq\n\t\t}\n\t\tscores {\n\t\t\t__typename\n\t\t\t... on MatchScores2026 {\n\t\t\t\tred {\n\t\t\t\t\t...Alliance2026\n\t\t\t\t}\n\t\t\t\tblue {\n\t\t\t\t\t...Alliance2026\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').MatchFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment EventSummary on Event {\n\t\tseason\n\t\tcode\n\t\tname\n\t\ttype\n\t\tstart\n\t\tend\n\t\tstarted\n\t\tongoing\n\t\tfinished\n\t\thasMatches\n\t\tremote\n\t\tlocation {\n\t\t\tcity\n\t\t\tstate\n\t\t\tcountry\n\t\t}\n\t}\n"): typeof import('./graphql').EventSummaryFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery EventLive($season: Int!, $code: String!) {\n\t\teventByCode(season: $season, code: $code) {\n\t\t\t...EventSummary\n\t\t\ttimezone\n\t\t\tliveStreamURL\n\t\t\twebcasts\n\t\t\tlocation {\n\t\t\t\tvenue\n\t\t\t}\n\t\t\tteams {\n\t\t\t\tteamNumber\n\t\t\t\tteam {\n\t\t\t\t\tname\n\t\t\t\t\tlocation {\n\t\t\t\t\t\tcity\n\t\t\t\t\t\tstate\n\t\t\t\t\t\tcountry\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tstats {\n\t\t\t\t\t...TeamStats\n\t\t\t\t}\n\t\t\t}\n\t\t\tmatches {\n\t\t\t\t...MatchFields\n\t\t\t}\n\t\t\t# Each team's stats from an earlier event: the matchup model's prior.\n\t\t\tpreviewStats {\n\t\t\t\tteamNumber\n\t\t\t\tstats {\n\t\t\t\t\t...TeamStats\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').EventLiveDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tsubscription NewMatches($season: Int!, $code: String!) {\n\t\tnewMatches(season: $season, code: $code) {\n\t\t\t...MatchFields\n\t\t}\n\t}\n"): typeof import('./graphql').NewMatchesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery EventsWindow($season: Int!, $start: Date!, $end: Date!) {\n\t\teventsSearch(season: $season, type: Competition, start: $start, end: $end) {\n\t\t\t...EventSummary\n\t\t}\n\t}\n"): typeof import('./graphql').EventsWindowDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery EventsSearch($season: Int!, $text: String!) {\n\t\teventsSearch(season: $season, type: Competition, searchText: $text, limit: 30) {\n\t\t\t...EventSummary\n\t\t}\n\t}\n"): typeof import('./graphql').EventsSearchDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery TeamSearch($text: String!) {\n\t\tteamsSearch(searchText: $text, limit: 8) {\n\t\t\tnumber\n\t\t\tname\n\t\t\tlocation {\n\t\t\t\tcity\n\t\t\t\tstate\n\t\t\t\tcountry\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').TeamSearchDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery MyTeam($number: Int!, $season: Int!) {\n\t\tteamByNumber(number: $number) {\n\t\t\tnumber\n\t\t\tname\n\t\t\tschoolName\n\t\t\trookieYear\n\t\t\tlocation {\n\t\t\t\tcity\n\t\t\t\tstate\n\t\t\t\tcountry\n\t\t\t}\n\t\t\tquickStats(season: $season) {\n\t\t\t\tcount\n\t\t\t\ttot {\n\t\t\t\t\tvalue\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t\tauto {\n\t\t\t\t\tvalue\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t\tdc {\n\t\t\t\t\tvalue\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t\teg {\n\t\t\t\t\tvalue\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t}\n\t\t\tevents(season: $season) {\n\t\t\t\tstats {\n\t\t\t\t\t...TeamStats\n\t\t\t\t}\n\t\t\t\tevent {\n\t\t\t\t\t...EventSummary\n\t\t\t\t\tregionCode\n\t\t\t\t\tleagueCode\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').MyTeamDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery TeamScopeRanks($number: Int!, $season: Int!, $region: RegionOption!, $nation: RegionOption!) {\n\t\tteamByNumber(number: $number) {\n\t\t\tnumber\n\t\t\tregion: quickStats(season: $season, region: $region) {\n\t\t\t\tcount\n\t\t\t\ttot {\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t}\n\t\t\tnation: quickStats(season: $season, region: $nation) {\n\t\t\t\tcount\n\t\t\t\ttot {\n\t\t\t\t\trank\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').TeamScopeRanksDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery RegionLeagueEvents($season: Int!, $region: RegionOption!) {\n\t\tmeets: eventsSearch(season: $season, region: $region, type: LeagueMeet) {\n\t\t\tcode\n\t\t\tleagueCode\n\t\t}\n\t\ttournaments: eventsSearch(season: $season, region: $region, type: LeagueTournament) {\n\t\t\tcode\n\t\t\tleagueCode\n\t\t}\n\t}\n"): typeof import('./graphql').RegionLeagueEventsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery EventTeamStats($season: Int!, $code: String!) {\n\t\teventByCode(season: $season, code: $code) {\n\t\t\tcode\n\t\t\tteams {\n\t\t\t\tteamNumber\n\t\t\t\tstats {\n\t\t\t\t\t...TeamStats\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').EventTeamStatsDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
