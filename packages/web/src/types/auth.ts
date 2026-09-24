export interface UserRecord {
  id: string;
  google_id: string | null;
  email: string;
  name: string;
  picture: string | null;
  pop_id: string | null;
  birth_date: string | null;
  is_verified: number;
  created_at: string;
  updated_at: string;
}

export interface PlayerStats {
  popId: string;
  totalTournaments: number;
  totalMatches: number;
  wins: number;
  ties: number;
  losses: number;
  winRate: number;
  bestPlace: number | null;
  firstPlaceCount: number;
}

export interface PlayerTournamentMatch {
  matchId: string;
  roundNumber: number;
  tableNumber: number;
  opponentName: string;
  opponentPopId: string;
  status: string;
  result: 'VITÓRIA' | 'DERROTA' | 'EMPATE' | 'EM_ANDAMENTO';
}

export interface PlayerTournamentHistoryItem {
  tournamentId: string;
  tournamentName: string;
  startDate: string;
  city: string;
  place: number | null;
  totalPlayers: number;
  wins: number;
  ties: number;
  losses: number;
  matches: PlayerTournamentMatch[];
}
