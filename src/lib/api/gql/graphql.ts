/* eslint-disable */
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Alliance =
  | 'Blue'
  | 'Red'
  | 'Solo';

export type AllianceRole =
  | 'Captain'
  | 'FirstPick'
  | 'SecondPick'
  | 'Solo';

export type EventType =
  | 'Championship'
  | 'DemoExhibition'
  | 'FIRSTChampionship'
  | 'InnovationChallenge'
  | 'Kickoff'
  | 'LeagueMeet'
  | 'LeagueTournament'
  | 'NonAdvancement'
  | 'OffSeason'
  | 'Other'
  | 'Pilot'
  | 'PracticeDay'
  | 'Premier'
  | 'Qualifier'
  | 'Scrimmage'
  | 'SuperQualifier'
  | 'VolunteerSignup'
  | 'Workshop';

export type RegionOption =
  | 'AE'
  | 'AR'
  | 'AU'
  | 'All'
  | 'BR'
  | 'CAAB'
  | 'CABC'
  | 'CANL'
  | 'CAON'
  | 'CAQC'
  | 'CMPIC'
  | 'CMPZ2'
  | 'CN'
  | 'CO'
  | 'CY'
  | 'DE'
  | 'EC'
  | 'ECB'
  | 'EG'
  | 'ES'
  | 'FPE'
  | 'FR'
  | 'GB'
  | 'GR'
  | 'HKG'
  | 'HT'
  | 'HU'
  | 'ID'
  | 'IL'
  | 'IN'
  | 'IND'
  | 'IT'
  | 'International'
  | 'JM'
  | 'JP'
  | 'KR'
  | 'KW'
  | 'KZ'
  | 'LT'
  | 'LY'
  | 'MA'
  | 'MD'
  | 'MX'
  | 'MY'
  | 'NG'
  | 'NL'
  | 'NZ'
  | 'ONADOD'
  | 'PA'
  | 'PL'
  | 'PT'
  | 'PY'
  | 'QA'
  | 'RO'
  | 'RU'
  | 'SA'
  | 'SV'
  | 'TH'
  | 'TR'
  | 'TT'
  | 'TW'
  | 'UA'
  | 'USAK'
  | 'USAL'
  | 'USAR'
  | 'USARL'
  | 'USAZ'
  | 'USCA'
  | 'USCALA'
  | 'USCALS'
  | 'USCANO'
  | 'USCASD'
  | 'USCHS'
  | 'USCO'
  | 'USCT'
  | 'USDE'
  | 'USFCT'
  | 'USFL'
  | 'USGA'
  | 'USHI'
  | 'USIA'
  | 'USID'
  | 'USIL'
  | 'USIN'
  | 'USKY'
  | 'USLA'
  | 'USMA'
  | 'USMD'
  | 'USMI'
  | 'USMN'
  | 'USMOKS'
  | 'USMS'
  | 'USMT'
  | 'USNC'
  | 'USND'
  | 'USNE'
  | 'USNH'
  | 'USNJ'
  | 'USNM'
  | 'USNV'
  | 'USNY'
  | 'USNYEX'
  | 'USNYLI'
  | 'USNYNY'
  | 'USOH'
  | 'USOK'
  | 'USOR'
  | 'USPA'
  | 'USPR'
  | 'USRI'
  | 'USSC'
  | 'USTN'
  | 'USTX'
  | 'USTXCE'
  | 'USTXHO'
  | 'USTXNO'
  | 'USTXSO'
  | 'USTXWP'
  | 'USUT'
  | 'USVA'
  | 'USVT'
  | 'USWA'
  | 'USWI'
  | 'USWV'
  | 'USWY'
  | 'UnitedStates'
  | 'VE'
  | 'VN'
  | 'ZA';

export type Station =
  | 'NotOnField'
  | 'One'
  | 'Solo'
  | 'Two';

export type TournamentLevel =
  | 'DoubleElim'
  | 'Finals'
  | 'Quals'
  | 'Semis';

export type Alliance2026Fragment = { totalPoints: number, totalPointsNp: number, penaltyPointsByOpp: number, autoPoints: number, autoLeavePoints: number, autoParkPoints: number, autoHivePoints: number, dcPoints: number, dcHivePoints: number, dcFlowerPoints: number, dcGardenPoints: number, dcParkPoints: number, swarmRp: boolean, pollinator1Rp: boolean, pollinator2Rp: boolean, tips: number, minorsCommitted: number, majorsCommitted: number };

export type StatGroup2026Fragment = { totalPointsNp: number, autoPoints: number, dcPoints: number, dcParkPoints: number, swarmRp: number, pollinator1Rp: number, pollinator2Rp: number };

type TeamStats_TeamEventStats2019_Fragment = { __typename: 'TeamEventStats2019' };

type TeamStats_TeamEventStats2020Remote_Fragment = { __typename: 'TeamEventStats2020Remote' };

type TeamStats_TeamEventStats2020Trad_Fragment = { __typename: 'TeamEventStats2020Trad' };

type TeamStats_TeamEventStats2021Remote_Fragment = { __typename: 'TeamEventStats2021Remote' };

type TeamStats_TeamEventStats2021Trad_Fragment = { __typename: 'TeamEventStats2021Trad' };

type TeamStats_TeamEventStats2022_Fragment = { __typename: 'TeamEventStats2022' };

type TeamStats_TeamEventStats2023_Fragment = { __typename: 'TeamEventStats2023' };

type TeamStats_TeamEventStats2024_Fragment = { __typename: 'TeamEventStats2024' };

type TeamStats_TeamEventStats2025_Fragment = { __typename: 'TeamEventStats2025' };

type TeamStats_TeamEventStats2026_Fragment = { __typename: 'TeamEventStats2026', rank: number, rp: number, tb1: number, tb2: number, wins: number, losses: number, ties: number, dqs: number, qualMatchesPlayed: number, opr: { totalPointsNp: number, autoPoints: number, dcPoints: number, dcParkPoints: number, swarmRp: number, pollinator1Rp: number, pollinator2Rp: number }, avg: { totalPointsNp: number, autoPoints: number, dcPoints: number, dcParkPoints: number, swarmRp: number, pollinator1Rp: number, pollinator2Rp: number }, max: { totalPointsNp: number } };

export type TeamStatsFragment =
  | TeamStats_TeamEventStats2019_Fragment
  | TeamStats_TeamEventStats2020Remote_Fragment
  | TeamStats_TeamEventStats2020Trad_Fragment
  | TeamStats_TeamEventStats2021Remote_Fragment
  | TeamStats_TeamEventStats2021Trad_Fragment
  | TeamStats_TeamEventStats2022_Fragment
  | TeamStats_TeamEventStats2023_Fragment
  | TeamStats_TeamEventStats2024_Fragment
  | TeamStats_TeamEventStats2025_Fragment
  | TeamStats_TeamEventStats2026_Fragment
;

export type MatchFieldsFragment = { id: number, tournamentLevel: TournamentLevel, series: number, matchNum: number, description: string, hasBeenPlayed: boolean, scheduledStartTime: string | null, actualStartTime: string | null, postResultTime: string | null, teams: Array<{ teamNumber: number, alliance: Alliance, station: Station, allianceRole: AllianceRole, surrogate: boolean, noShow: boolean, dq: boolean }>, scores:
    | { __typename: 'MatchScores2019' }
    | { __typename: 'MatchScores2020Remote' }
    | { __typename: 'MatchScores2020Trad' }
    | { __typename: 'MatchScores2021Remote' }
    | { __typename: 'MatchScores2021Trad' }
    | { __typename: 'MatchScores2022' }
    | { __typename: 'MatchScores2023' }
    | { __typename: 'MatchScores2024' }
    | { __typename: 'MatchScores2025' }
    | { __typename: 'MatchScores2026', red: { totalPoints: number, totalPointsNp: number, penaltyPointsByOpp: number, autoPoints: number, autoLeavePoints: number, autoParkPoints: number, autoHivePoints: number, dcPoints: number, dcHivePoints: number, dcFlowerPoints: number, dcGardenPoints: number, dcParkPoints: number, swarmRp: boolean, pollinator1Rp: boolean, pollinator2Rp: boolean, tips: number, minorsCommitted: number, majorsCommitted: number }, blue: { totalPoints: number, totalPointsNp: number, penaltyPointsByOpp: number, autoPoints: number, autoLeavePoints: number, autoParkPoints: number, autoHivePoints: number, dcPoints: number, dcHivePoints: number, dcFlowerPoints: number, dcGardenPoints: number, dcParkPoints: number, swarmRp: boolean, pollinator1Rp: boolean, pollinator2Rp: boolean, tips: number, minorsCommitted: number, majorsCommitted: number } }
   | null };

export type EventSummaryFragment = { season: number, code: string, name: string, type: EventType, start: string, end: string, started: boolean, ongoing: boolean, finished: boolean, hasMatches: boolean, remote: boolean, location: { city: string, state: string, country: string } };

export type EventLiveQueryVariables = Exact<{
  season: number;
  code: string;
}>;


export type EventLiveQuery = { eventByCode: { timezone: string, liveStreamURL: string | null, webcasts: Array<string>, season: number, code: string, name: string, type: EventType, start: string, end: string, started: boolean, ongoing: boolean, finished: boolean, hasMatches: boolean, remote: boolean, location: { venue: string | null, city: string, state: string, country: string }, teams: Array<{ teamNumber: number, team: { name: string, location: { city: string, state: string, country: string } }, stats:
        | { __typename: 'TeamEventStats2019' }
        | { __typename: 'TeamEventStats2020Remote' }
        | { __typename: 'TeamEventStats2020Trad' }
        | { __typename: 'TeamEventStats2021Remote' }
        | { __typename: 'TeamEventStats2021Trad' }
        | { __typename: 'TeamEventStats2022' }
        | { __typename: 'TeamEventStats2023' }
        | { __typename: 'TeamEventStats2024' }
        | { __typename: 'TeamEventStats2025' }
        | { __typename: 'TeamEventStats2026', rank: number, rp: number, tb1: number, tb2: number, wins: number, losses: number, ties: number, dqs: number, qualMatchesPlayed: number, opr: { totalPointsNp: number, autoPoints: number, dcPoints: number, dcParkPoints: number, swarmRp: number, pollinator1Rp: number, pollinator2Rp: number }, avg: { totalPointsNp: number, autoPoints: number, dcPoints: number, dcParkPoints: number, swarmRp: number, pollinator1Rp: number, pollinator2Rp: number }, max: { totalPointsNp: number } }
       | null }>, matches: Array<{ id: number, tournamentLevel: TournamentLevel, series: number, matchNum: number, description: string, hasBeenPlayed: boolean, scheduledStartTime: string | null, actualStartTime: string | null, postResultTime: string | null, teams: Array<{ teamNumber: number, alliance: Alliance, station: Station, allianceRole: AllianceRole, surrogate: boolean, noShow: boolean, dq: boolean }>, scores:
        | { __typename: 'MatchScores2019' }
        | { __typename: 'MatchScores2020Remote' }
        | { __typename: 'MatchScores2020Trad' }
        | { __typename: 'MatchScores2021Remote' }
        | { __typename: 'MatchScores2021Trad' }
        | { __typename: 'MatchScores2022' }
        | { __typename: 'MatchScores2023' }
        | { __typename: 'MatchScores2024' }
        | { __typename: 'MatchScores2025' }
        | { __typename: 'MatchScores2026', red: { totalPoints: number, totalPointsNp: number, penaltyPointsByOpp: number, autoPoints: number, autoLeavePoints: number, autoParkPoints: number, autoHivePoints: number, dcPoints: number, dcHivePoints: number, dcFlowerPoints: number, dcGardenPoints: number, dcParkPoints: number, swarmRp: boolean, pollinator1Rp: boolean, pollinator2Rp: boolean, tips: number, minorsCommitted: number, majorsCommitted: number }, blue: { totalPoints: number, totalPointsNp: number, penaltyPointsByOpp: number, autoPoints: number, autoLeavePoints: number, autoParkPoints: number, autoHivePoints: number, dcPoints: number, dcHivePoints: number, dcFlowerPoints: number, dcGardenPoints: number, dcParkPoints: number, swarmRp: boolean, pollinator1Rp: boolean, pollinator2Rp: boolean, tips: number, minorsCommitted: number, majorsCommitted: number } }
       | null }>, previewStats: Array<{ teamNumber: number, stats:
        | { __typename: 'TeamEventStats2019' }
        | { __typename: 'TeamEventStats2020Remote' }
        | { __typename: 'TeamEventStats2020Trad' }
        | { __typename: 'TeamEventStats2021Remote' }
        | { __typename: 'TeamEventStats2021Trad' }
        | { __typename: 'TeamEventStats2022' }
        | { __typename: 'TeamEventStats2023' }
        | { __typename: 'TeamEventStats2024' }
        | { __typename: 'TeamEventStats2025' }
        | { __typename: 'TeamEventStats2026', rank: number, rp: number, tb1: number, tb2: number, wins: number, losses: number, ties: number, dqs: number, qualMatchesPlayed: number, opr: { totalPointsNp: number, autoPoints: number, dcPoints: number, dcParkPoints: number, swarmRp: number, pollinator1Rp: number, pollinator2Rp: number }, avg: { totalPointsNp: number, autoPoints: number, dcPoints: number, dcParkPoints: number, swarmRp: number, pollinator1Rp: number, pollinator2Rp: number }, max: { totalPointsNp: number } }
       | null }> | null } | null };

export type NewMatchesSubscriptionVariables = Exact<{
  season: number;
  code: string;
}>;


export type NewMatchesSubscription = { newMatches: Array<{ id: number, tournamentLevel: TournamentLevel, series: number, matchNum: number, description: string, hasBeenPlayed: boolean, scheduledStartTime: string | null, actualStartTime: string | null, postResultTime: string | null, teams: Array<{ teamNumber: number, alliance: Alliance, station: Station, allianceRole: AllianceRole, surrogate: boolean, noShow: boolean, dq: boolean }>, scores:
      | { __typename: 'MatchScores2019' }
      | { __typename: 'MatchScores2020Remote' }
      | { __typename: 'MatchScores2020Trad' }
      | { __typename: 'MatchScores2021Remote' }
      | { __typename: 'MatchScores2021Trad' }
      | { __typename: 'MatchScores2022' }
      | { __typename: 'MatchScores2023' }
      | { __typename: 'MatchScores2024' }
      | { __typename: 'MatchScores2025' }
      | { __typename: 'MatchScores2026', red: { totalPoints: number, totalPointsNp: number, penaltyPointsByOpp: number, autoPoints: number, autoLeavePoints: number, autoParkPoints: number, autoHivePoints: number, dcPoints: number, dcHivePoints: number, dcFlowerPoints: number, dcGardenPoints: number, dcParkPoints: number, swarmRp: boolean, pollinator1Rp: boolean, pollinator2Rp: boolean, tips: number, minorsCommitted: number, majorsCommitted: number }, blue: { totalPoints: number, totalPointsNp: number, penaltyPointsByOpp: number, autoPoints: number, autoLeavePoints: number, autoParkPoints: number, autoHivePoints: number, dcPoints: number, dcHivePoints: number, dcFlowerPoints: number, dcGardenPoints: number, dcParkPoints: number, swarmRp: boolean, pollinator1Rp: boolean, pollinator2Rp: boolean, tips: number, minorsCommitted: number, majorsCommitted: number } }
     | null }> | null };

export type EventsWindowQueryVariables = Exact<{
  season: number;
  start: string;
  end: string;
}>;


export type EventsWindowQuery = { eventsSearch: Array<{ season: number, code: string, name: string, type: EventType, start: string, end: string, started: boolean, ongoing: boolean, finished: boolean, hasMatches: boolean, remote: boolean, location: { city: string, state: string, country: string } }> };

export type SeasonEventsQueryVariables = Exact<{
  season: number;
}>;


export type SeasonEventsQuery = { eventsSearch: Array<{ season: number, code: string, name: string, type: EventType, start: string, end: string, started: boolean, ongoing: boolean, finished: boolean, hasMatches: boolean, remote: boolean, location: { city: string, state: string, country: string } }> };

export type LeaderboardQueryVariables = Exact<{
  season: number;
  region?: RegionOption | null | undefined;
  skip: number;
  take: number;
}>;


export type LeaderboardQuery = { tepRecords: { count: number, offset: number, data: Array<{ filterSkipRank: number, data: { teamNumber: number, eventCode: string, team: { name: string, location: { city: string, state: string, country: string } }, event: { name: string, start: string }, stats:
          | { __typename: 'TeamEventStats2019' }
          | { __typename: 'TeamEventStats2020Remote' }
          | { __typename: 'TeamEventStats2020Trad' }
          | { __typename: 'TeamEventStats2021Remote' }
          | { __typename: 'TeamEventStats2021Trad' }
          | { __typename: 'TeamEventStats2022' }
          | { __typename: 'TeamEventStats2023' }
          | { __typename: 'TeamEventStats2024' }
          | { __typename: 'TeamEventStats2025' }
          | { __typename: 'TeamEventStats2026', rank: number, rp: number, tb1: number, tb2: number, wins: number, losses: number, ties: number, dqs: number, qualMatchesPlayed: number, opr: { totalPointsNp: number, autoPoints: number, dcPoints: number, dcParkPoints: number, swarmRp: number, pollinator1Rp: number, pollinator2Rp: number }, avg: { totalPointsNp: number, autoPoints: number, dcPoints: number, dcParkPoints: number, swarmRp: number, pollinator1Rp: number, pollinator2Rp: number }, max: { totalPointsNp: number } }
         | null } }> } };

export type TeamMatchesQueryVariables = Exact<{
  number: number;
  season: number;
}>;


export type TeamMatchesQuery = { teamByNumber: { number: number, matches: Array<{ eventCode: string, matchId: number, alliance: Alliance, match: { id: number, tournamentLevel: TournamentLevel, series: number, matchNum: number, description: string, hasBeenPlayed: boolean, scheduledStartTime: string | null, actualStartTime: string | null, postResultTime: string | null, teams: Array<{ teamNumber: number, alliance: Alliance, station: Station, allianceRole: AllianceRole, surrogate: boolean, noShow: boolean, dq: boolean }>, scores:
          | { __typename: 'MatchScores2019' }
          | { __typename: 'MatchScores2020Remote' }
          | { __typename: 'MatchScores2020Trad' }
          | { __typename: 'MatchScores2021Remote' }
          | { __typename: 'MatchScores2021Trad' }
          | { __typename: 'MatchScores2022' }
          | { __typename: 'MatchScores2023' }
          | { __typename: 'MatchScores2024' }
          | { __typename: 'MatchScores2025' }
          | { __typename: 'MatchScores2026', red: { totalPoints: number, totalPointsNp: number, penaltyPointsByOpp: number, autoPoints: number, autoLeavePoints: number, autoParkPoints: number, autoHivePoints: number, dcPoints: number, dcHivePoints: number, dcFlowerPoints: number, dcGardenPoints: number, dcParkPoints: number, swarmRp: boolean, pollinator1Rp: boolean, pollinator2Rp: boolean, tips: number, minorsCommitted: number, majorsCommitted: number }, blue: { totalPoints: number, totalPointsNp: number, penaltyPointsByOpp: number, autoPoints: number, autoLeavePoints: number, autoParkPoints: number, autoHivePoints: number, dcPoints: number, dcHivePoints: number, dcFlowerPoints: number, dcGardenPoints: number, dcParkPoints: number, swarmRp: boolean, pollinator1Rp: boolean, pollinator2Rp: boolean, tips: number, minorsCommitted: number, majorsCommitted: number } }
         | null } }> } | null };

export type TeamSearchQueryVariables = Exact<{
  text: string;
}>;


export type TeamSearchQuery = { teamsSearch: Array<{ number: number, name: string, location: { city: string, state: string, country: string } }> };

export type MyTeamQueryVariables = Exact<{
  number: number;
  season: number;
}>;


export type MyTeamQuery = { teamByNumber: { number: number, name: string, schoolName: string, rookieYear: number, location: { city: string, state: string, country: string }, quickStats: { count: number, tot: { value: number, rank: number }, auto: { value: number, rank: number }, dc: { value: number, rank: number }, eg: { value: number, rank: number } } | null, events: Array<{ stats:
        | { __typename: 'TeamEventStats2019' }
        | { __typename: 'TeamEventStats2020Remote' }
        | { __typename: 'TeamEventStats2020Trad' }
        | { __typename: 'TeamEventStats2021Remote' }
        | { __typename: 'TeamEventStats2021Trad' }
        | { __typename: 'TeamEventStats2022' }
        | { __typename: 'TeamEventStats2023' }
        | { __typename: 'TeamEventStats2024' }
        | { __typename: 'TeamEventStats2025' }
        | { __typename: 'TeamEventStats2026', rank: number, rp: number, tb1: number, tb2: number, wins: number, losses: number, ties: number, dqs: number, qualMatchesPlayed: number, opr: { totalPointsNp: number, autoPoints: number, dcPoints: number, dcParkPoints: number, swarmRp: number, pollinator1Rp: number, pollinator2Rp: number }, avg: { totalPointsNp: number, autoPoints: number, dcPoints: number, dcParkPoints: number, swarmRp: number, pollinator1Rp: number, pollinator2Rp: number }, max: { totalPointsNp: number } }
       | null, event: { regionCode: string | null, leagueCode: string | null, season: number, code: string, name: string, type: EventType, start: string, end: string, started: boolean, ongoing: boolean, finished: boolean, hasMatches: boolean, remote: boolean, location: { city: string, state: string, country: string } } }> } | null };

export type TeamScopeRanksQueryVariables = Exact<{
  number: number;
  season: number;
  region: RegionOption;
  nation: RegionOption;
}>;


export type TeamScopeRanksQuery = { teamByNumber: { number: number, region: { count: number, tot: { rank: number } } | null, nation: { count: number, tot: { rank: number } } | null } | null };

export type RegionLeagueEventsQueryVariables = Exact<{
  season: number;
  region: RegionOption;
}>;


export type RegionLeagueEventsQuery = { meets: Array<{ code: string, leagueCode: string | null }>, tournaments: Array<{ code: string, leagueCode: string | null }> };

export type EventTeamStatsQueryVariables = Exact<{
  season: number;
  code: string;
}>;


export type EventTeamStatsQuery = { eventByCode: { code: string, teams: Array<{ teamNumber: number, stats:
        | { __typename: 'TeamEventStats2019' }
        | { __typename: 'TeamEventStats2020Remote' }
        | { __typename: 'TeamEventStats2020Trad' }
        | { __typename: 'TeamEventStats2021Remote' }
        | { __typename: 'TeamEventStats2021Trad' }
        | { __typename: 'TeamEventStats2022' }
        | { __typename: 'TeamEventStats2023' }
        | { __typename: 'TeamEventStats2024' }
        | { __typename: 'TeamEventStats2025' }
        | { __typename: 'TeamEventStats2026', rank: number, rp: number, tb1: number, tb2: number, wins: number, losses: number, ties: number, dqs: number, qualMatchesPlayed: number, opr: { totalPointsNp: number, autoPoints: number, dcPoints: number, dcParkPoints: number, swarmRp: number, pollinator1Rp: number, pollinator2Rp: number }, avg: { totalPointsNp: number, autoPoints: number, dcPoints: number, dcParkPoints: number, swarmRp: number, pollinator1Rp: number, pollinator2Rp: number }, max: { totalPointsNp: number } }
       | null }> } | null };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}
export const StatGroup2026FragmentDoc = new TypedDocumentString(`
    fragment StatGroup2026 on TeamEventStats2026Group {
  totalPointsNp
  autoPoints
  dcPoints
  dcParkPoints
  swarmRp
  pollinator1Rp
  pollinator2Rp
}
    `, {"fragmentName":"StatGroup2026"}) as unknown as TypedDocumentString<StatGroup2026Fragment, unknown>;
export const TeamStatsFragmentDoc = new TypedDocumentString(`
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
    fragment StatGroup2026 on TeamEventStats2026Group {
  totalPointsNp
  autoPoints
  dcPoints
  dcParkPoints
  swarmRp
  pollinator1Rp
  pollinator2Rp
}`, {"fragmentName":"TeamStats"}) as unknown as TypedDocumentString<TeamStatsFragment, unknown>;
export const Alliance2026FragmentDoc = new TypedDocumentString(`
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
    `, {"fragmentName":"Alliance2026"}) as unknown as TypedDocumentString<Alliance2026Fragment, unknown>;
export const MatchFieldsFragmentDoc = new TypedDocumentString(`
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
}`, {"fragmentName":"MatchFields"}) as unknown as TypedDocumentString<MatchFieldsFragment, unknown>;
export const EventSummaryFragmentDoc = new TypedDocumentString(`
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
    `, {"fragmentName":"EventSummary"}) as unknown as TypedDocumentString<EventSummaryFragment, unknown>;
export const EventLiveDocument = new TypedDocumentString(`
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
    previewStats {
      teamNumber
      stats {
        ...TeamStats
      }
    }
  }
}
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
fragment StatGroup2026 on TeamEventStats2026Group {
  totalPointsNp
  autoPoints
  dcPoints
  dcParkPoints
  swarmRp
  pollinator1Rp
  pollinator2Rp
}
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
}`) as unknown as TypedDocumentString<EventLiveQuery, EventLiveQueryVariables>;
export const NewMatchesDocument = new TypedDocumentString(`
    subscription NewMatches($season: Int!, $code: String!) {
  newMatches(season: $season, code: $code) {
    ...MatchFields
  }
}
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
}`) as unknown as TypedDocumentString<NewMatchesSubscription, NewMatchesSubscriptionVariables>;
export const EventsWindowDocument = new TypedDocumentString(`
    query EventsWindow($season: Int!, $start: Date!, $end: Date!) {
  eventsSearch(season: $season, type: Competition, start: $start, end: $end) {
    ...EventSummary
  }
}
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
}`) as unknown as TypedDocumentString<EventsWindowQuery, EventsWindowQueryVariables>;
export const SeasonEventsDocument = new TypedDocumentString(`
    query SeasonEvents($season: Int!) {
  eventsSearch(season: $season, type: Competition) {
    ...EventSummary
  }
}
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
}`) as unknown as TypedDocumentString<SeasonEventsQuery, SeasonEventsQueryVariables>;
export const LeaderboardDocument = new TypedDocumentString(`
    query Leaderboard($season: Int!, $region: RegionOption, $skip: Int!, $take: Int!) {
  tepRecords(
    season: $season
    region: $region
    sortBy: "opr.totalPointsNp"
    sortDir: Desc
    skip: $skip
    take: $take
  ) {
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
    fragment StatGroup2026 on TeamEventStats2026Group {
  totalPointsNp
  autoPoints
  dcPoints
  dcParkPoints
  swarmRp
  pollinator1Rp
  pollinator2Rp
}
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
}`) as unknown as TypedDocumentString<LeaderboardQuery, LeaderboardQueryVariables>;
export const TeamMatchesDocument = new TypedDocumentString(`
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
}`) as unknown as TypedDocumentString<TeamMatchesQuery, TeamMatchesQueryVariables>;
export const TeamSearchDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<TeamSearchQuery, TeamSearchQueryVariables>;
export const MyTeamDocument = new TypedDocumentString(`
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
    fragment StatGroup2026 on TeamEventStats2026Group {
  totalPointsNp
  autoPoints
  dcPoints
  dcParkPoints
  swarmRp
  pollinator1Rp
  pollinator2Rp
}
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
}`) as unknown as TypedDocumentString<MyTeamQuery, MyTeamQueryVariables>;
export const TeamScopeRanksDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<TeamScopeRanksQuery, TeamScopeRanksQueryVariables>;
export const RegionLeagueEventsDocument = new TypedDocumentString(`
    query RegionLeagueEvents($season: Int!, $region: RegionOption!) {
  meets: eventsSearch(season: $season, region: $region, type: LeagueMeet) {
    code
    leagueCode
  }
  tournaments: eventsSearch(
    season: $season
    region: $region
    type: LeagueTournament
  ) {
    code
    leagueCode
  }
}
    `) as unknown as TypedDocumentString<RegionLeagueEventsQuery, RegionLeagueEventsQueryVariables>;
export const EventTeamStatsDocument = new TypedDocumentString(`
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
    fragment StatGroup2026 on TeamEventStats2026Group {
  totalPointsNp
  autoPoints
  dcPoints
  dcParkPoints
  swarmRp
  pollinator1Rp
  pollinator2Rp
}
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
}`) as unknown as TypedDocumentString<EventTeamStatsQuery, EventTeamStatsQueryVariables>;