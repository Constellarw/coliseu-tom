import { DatabaseService } from '../db/database.js';

export interface PlayerStats {
  popId: string;
  totalTournaments: number;
  totalMatches: number;
  wins: number;
  ties: number;
  losses: number;
  winRate: number; // percentage 0-100
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

export class ProfileService {
  constructor(private dbService: DatabaseService) {}

  public async getPlayerStats(popId: string): Promise<PlayerStats> {
    const cleanId = popId.trim();

    // 1. Total distinct tournaments
    const tourneyRow = await this.dbService.queryOne<{ count: number }>(
      'SELECT COUNT(DISTINCT tournament_id) as count FROM players WHERE user_id = ?',
      [cleanId]
    );

    // 2. Completed matches breakdown
    const matches = await this.dbService.queryAll<{ confirmed_winner_id: string | null; is_tie: number; status: string }>(
      `SELECT confirmed_winner_id, is_tie, status
       FROM matches
       WHERE (player1_id = ? OR player2_id = ?) AND status = 'CONFIRMED'`,
      [cleanId, cleanId]
    );

    let wins = 0;
    let ties = 0;
    let losses = 0;

    for (const m of matches) {
      if (m.is_tie === 1) {
        ties++;
      } else if (m.confirmed_winner_id === cleanId) {
        wins++;
      } else if (m.confirmed_winner_id) {
        losses++;
      }
    }

    const totalMatches = wins + ties + losses;
    const winRate = totalMatches > 0 ? Math.round(((wins + ties * 0.5) / totalMatches) * 100) : 0;

    // 3. Best place and 1st places
    const standings = await this.dbService.queryAll<{ place: number }>(
      'SELECT place FROM standings WHERE player_id = ? ORDER BY place ASC',
      [cleanId]
    );

    const bestPlace = standings.length > 0 ? standings[0].place : null;
    const firstPlaceCount = standings.filter((s) => s.place === 1).length;

    return {
      popId: cleanId,
      totalTournaments: tourneyRow ? tourneyRow.count : 0,
      totalMatches,
      wins,
      ties,
      losses,
      winRate,
      bestPlace,
      firstPlaceCount
    };
  }

  public async getTournamentHistory(popId: string): Promise<PlayerTournamentHistoryItem[]> {
    const cleanId = popId.trim();

    // Get all tournaments where player was registered
    const tourneys = await this.dbService.queryAll<{ id: string; name: string; start_date: string; city: string }>(
      `SELECT DISTINCT t.id, t.name, t.start_date, t.city
       FROM tournaments t
       JOIN players p ON p.tournament_id = t.id
       WHERE p.user_id = ?
       ORDER BY t.start_date DESC, t.updated_at DESC`,
      [cleanId]
    );

    const result: PlayerTournamentHistoryItem[] = [];

    for (const t of tourneys) {
      // Total players in tournament
      const countRow = await this.dbService.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM players WHERE tournament_id = ?',
        [t.id]
      );

      // Placement
      const standingRow = await this.dbService.queryOne<{ place: number }>(
        'SELECT place FROM standings WHERE tournament_id = ? AND player_id = ? LIMIT 1',
        [t.id, cleanId]
      );

      // Matches in this tournament
      const matchRows = await this.dbService.queryAll<any>(
        `SELECT 
          m.id, m.round_number, m.table_number, m.player1_id, m.player2_id,
          m.status, m.confirmed_winner_id, m.is_tie,
          p1.full_name as p1_name,
          p2.full_name as p2_name
        FROM matches m
        LEFT JOIN players p1 ON p1.tournament_id = m.tournament_id AND p1.user_id = m.player1_id
        LEFT JOIN players p2 ON p2.tournament_id = m.tournament_id AND p2.user_id = m.player2_id
        WHERE m.tournament_id = ? AND (m.player1_id = ? OR m.player2_id = ?)
        ORDER BY m.round_number ASC`,
        [t.id, cleanId, cleanId]
      );

      let wins = 0;
      let ties = 0;
      let losses = 0;
      const matches: PlayerTournamentMatch[] = [];

      for (const m of matchRows) {
        const isP1 = m.player1_id === cleanId;
        const opponentName = isP1 ? (m.p2_name || 'BYE') : (m.p1_name || 'BYE');
        const opponentPopId = isP1 ? m.player2_id : m.player1_id;

        let res: 'VITÓRIA' | 'DERROTA' | 'EMPATE' | 'EM_ANDAMENTO' = 'EM_ANDAMENTO';
        if (m.status === 'CONFIRMED') {
          if (m.is_tie === 1) {
            res = 'EMPATE';
            ties++;
          } else if (m.confirmed_winner_id === cleanId) {
            res = 'VITÓRIA';
            wins++;
          } else {
            res = 'DERROTA';
            losses++;
          }
        }

        matches.push({
          matchId: m.id,
          roundNumber: m.round_number,
          tableNumber: m.table_number,
          opponentName,
          opponentPopId,
          status: m.status,
          result: res
        });
      }

      result.push({
        tournamentId: t.id,
        tournamentName: t.name,
        startDate: t.start_date,
        city: t.city || 'Mogi Guaçu - SP',
        place: standingRow ? standingRow.place : null,
        totalPlayers: countRow ? countRow.count : 0,
        wins,
        ties,
        losses,
        matches
      });
    }

    return result;
  }
}
