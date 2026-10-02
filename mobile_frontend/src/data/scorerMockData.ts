/**
 * src/data/scorerMockData.ts
 * Type definitions only - Hardcoded cricket mock objects removed.
 * All match and scorecard data is strictly loaded from the MySQL database via REST API.
 */

export type MatchStatus = 'Upcoming' | 'Live' | 'Completed';

export interface MatchData {
  id: string;
  tournament: string;
  teamA: string;
  teamB: string;
  date: string;
  venue: string;
  format: string;
  status: MatchStatus;
  scoreA?: string;
  scoreB?: string;
  result?: string;
}

export const assignedMatches: MatchData[] = [];

export const mockScorerProfile = {
  name: '',
  id: '',
  association: ''
};
