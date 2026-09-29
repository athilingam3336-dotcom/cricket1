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

export const assignedMatches: MatchData[] = [
  {
    id: 'M001',
    tournament: 'VPL 2026',
    teamA: 'Virudhunagar Strikers',
    teamB: 'Sivakasi Super Kings',
    date: '2026-10-15 10:00 AM',
    venue: 'Kamarajar Stadium',
    format: 'T20',
    status: 'Upcoming'
  },
  {
    id: 'M002',
    tournament: 'District Cup',
    teamA: 'Aruppukottai Avengers',
    teamB: 'Rajapalayam Royals',
    date: '2026-10-16 02:00 PM',
    venue: 'Srivilliputhur Ground',
    format: 'T20',
    status: 'Live',
    scoreA: '145/4 (15.2)',
    scoreB: 'Yet to bat'
  },
  {
    id: 'M003',
    tournament: 'VPL 2026',
    teamA: 'Sattur Spartans',
    teamB: 'Virudhunagar Strikers',
    date: '2026-10-10 10:00 AM',
    venue: 'Kamarajar Stadium',
    format: 'T20',
    status: 'Completed',
    scoreA: '160/8 (20)',
    scoreB: '162/3 (18.4)',
    result: 'Virudhunagar Strikers won by 7 wickets'
  }
];

export const mockScorerProfile = {
  name: 'S. Ramesh',
  id: 'SCR-101',
  association: 'Virudhunagar District'
};
