import { parseTdf, TournamentData, TomPlayer } from '@tom/core';
import { DatabaseService } from '../db/database.js';

export interface PlayerActiveMatchView {
  matchId: string;
  tournamentId: string;
  roundNumber: number;
  tableNumber: number;
  isPlayer1: boolean;
  player: TomPlayer;
  opponent: TomPlayer | null;
  status: string;
  p1ReportedWinner: string | null;
  p2ReportedWinner: string | null;
  confirmedWinnerId: string | null;
  isTie: boolean;
  tomOutcome: string;
}

export interface PairingView {
  matchId: string;
  roundNumber: number;
  tableNumber: number;
  category: string;
  player1: TomPlayer | null;
  player2: TomPlayer | null;
  status: string;
  confirmedWinnerId: string | null;
  isTie: boolean;
  tomOutcome: string;
}

export class TournamentService {
  constructor(private dbService: DatabaseService) {}

  public async ingestTdf(tournamentId: string, rawXml: string): Promise<TournamentData> {
    const data = parseTdf(rawXml);
    const now = new Date().toISOString();

    // Calculate max round number
    let maxRound = 1;
    for (const pod of data.pods) {
      for (const r of pod.rounds) {
        if (r.number > maxRound) {
          maxRound = r.number;
        }
      }
    }

    // Upsert Tournament
    await this.dbService.run(
      `INSERT INTO tournaments (id, name, city, state, country, organizer_name, organizer_pop_id, round_time, start_date, current_round, raw_tdf, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         city = excluded.city,
         state = excluded.state,
         country = excluded.country,
         organizer_name = excluded.organizer_name,
         organizer_pop_id = excluded.organizer_pop_id,
         round_time = excluded.round_time,
         start_date = excluded.start_date,
         current_round = excluded.current_round,
         raw_tdf = excluded.raw_tdf,
         updated_at = excluded.updated_at`,
      [
        tournamentId,
        data.data.name,
        data.data.city || '',
        data.data.state || '',
        data.data.country || '',
        data.data.organizerName || '',
        data.data.organizerPopId || '',
        data.data.roundTimeMinutes || 30,
        data.data.startDate || '',
        maxRound,
        rawXml,
        now
      ]
    );

    // Upsert Players
    for (const p of Object.values(data.players) as any[]) {
      const playerId = `${tournamentId}_${p.userid}`;
      await this.dbService.run(
        `INSERT INTO players (id, tournament_id, user_id, first_name, last_name, full_name, birth_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           first_name = excluded.first_name,
           last_name = excluded.last_name,
           full_name = excluded.full_name,
           birth_date = excluded.birth_date`,
        [
          playerId,
          tournamentId,
          p.userid,
          p.firstName,
          p.lastName,
          p.fullName,
          p.birthDate || ''
        ]
      );
    }

    // Upsert Pods & Matches
    for (const pod of data.pods) {
      for (const r of pod.rounds) {
        for (const m of r.matches) {
          const matchId = `${tournamentId}_cat${pod.category}_r${r.number}_t${m.tableNumber}`;

          // Existing match preservation for report status
          const existing = await this.dbService.queryOne<any>(
            'SELECT status, p1_reported_winner, p2_reported_winner, confirmed_winner_id, is_tie FROM matches WHERE id = ?',
            [matchId]
          );

          const status = existing?.status || (m.outcome !== '0' ? 'CONFIRMED' : 'IN_PROGRESS');
          const p1Report = existing?.p1_reported_winner || null;
          const p2Report = existing?.p2_reported_winner || null;
          const confirmedWinner =
            existing?.confirmed_winner_id ||
            (m.outcome === '1' ? m.player1Id : m.outcome === '2' ? m.player2Id : null);
          const isTie = existing?.is_tie ?? (m.outcome === '3' ? 1 : 0);

          await this.dbService.run(
            `INSERT INTO matches (id, tournament_id, pod_category, round_number, table_number, player1_id, player2_id, tom_outcome, status, p1_reported_winner, p2_reported_winner, confirmed_winner_id, is_tie, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               tom_outcome = excluded.tom_outcome,
               status = CASE WHEN matches.status = 'CONFIRMED' THEN matches.status ELSE excluded.status END,
               updated_at = excluded.updated_at`,
            [
              matchId,
              tournamentId,
              pod.category,
              r.number,
              m.tableNumber,
              m.player1Id,
              m.player2Id,
              m.outcome,
              status,
              p1Report,
              p2Report,
              confirmedWinner,
              isTie,
              now
            ]
          );
        }
      }
    }

    // Upsert Standings
    await this.dbService.run('DELETE FROM standings WHERE tournament_id = ?', [tournamentId]);
    for (const sp of data.standings) {
      for (const rank of sp.rankings) {
        const standingId = `${tournamentId}_${sp.category}_p${rank.place}`;
        await this.dbService.run(
          `INSERT INTO standings (id, tournament_id, pod_category, player_id, place)
           VALUES (?, ?, ?, ?, ?)`,
          [standingId, tournamentId, sp.category, rank.playerId, rank.place]
        );
      }
    }

    return data;
  }

  public async getPlayerActiveMatch(
    tournamentId: string,
    popId: string
  ): Promise<PlayerActiveMatchView | null> {
    const tourney = await this.dbService.queryOne<any>(
      'SELECT current_round FROM tournaments WHERE id = ?',
      [tournamentId]
    );
    if (!tourney) return null;

    const roundNumber = tourney.current_round;

    const match = await this.dbService.queryOne<any>(
      `SELECT * FROM matches
       WHERE tournament_id = ? AND round_number = ? AND (player1_id = ? OR player2_id = ?)`,
      [tournamentId, roundNumber, popId, popId]
    );

    if (!match) return null;

    const isPlayer1 = match.player1_id === popId;
    const opponentId = isPlayer1 ? match.player2_id : match.player1_id;

    const playerRow = await this.dbService.queryOne<any>(
      'SELECT * FROM players WHERE tournament_id = ? AND user_id = ?',
      [tournamentId, popId]
    );
    const opponentRow = opponentId
      ? await this.dbService.queryOne<any>(
          'SELECT * FROM players WHERE tournament_id = ? AND user_id = ?',
          [tournamentId, opponentId]
        )
      : null;

    return {
      matchId: match.id,
      tournamentId,
      roundNumber: match.round_number,
      tableNumber: match.table_number,
      isPlayer1,
      player: {
        userid: popId,
        firstName: playerRow?.first_name || '',
        lastName: playerRow?.last_name || '',
        fullName: playerRow?.full_name || popId
      },
      opponent: opponentRow
        ? {
            userid: opponentRow.user_id,
            firstName: opponentRow.first_name || '',
            lastName: opponentRow.last_name || '',
            fullName: opponentRow.full_name || opponentId
          }
        : null,
      status: match.status,
      p1ReportedWinner: match.p1_reported_winner,
      p2ReportedWinner: match.p2_reported_winner,
      confirmedWinnerId: match.confirmed_winner_id,
      isTie: Boolean(match.is_tie),
      tomOutcome: match.tom_outcome
    };
  }

  public async getStandings(
    tournamentId: string,
    category?: string
  ): Promise<Array<{ place: number; player: TomPlayer; category: string }>> {
    let sql = `
      SELECT s.place, s.pod_category, p.user_id, p.first_name, p.last_name, p.full_name
      FROM standings s
      JOIN players p ON s.tournament_id = p.tournament_id AND s.player_id = p.user_id
      WHERE s.tournament_id = ?
    `;
    const params: any[] = [tournamentId];

    if (category) {
      sql += ' AND s.pod_category = ?';
      params.push(category);
    }

    sql += ' ORDER BY s.place ASC';

    const rows = await this.dbService.queryAll<any>(sql, params);

    return rows.map((r) => ({
      place: r.place,
      category: r.pod_category,
      player: {
        userid: r.user_id,
        firstName: r.first_name,
        lastName: r.last_name,
        fullName: r.full_name
      }
    }));
  }

  public async getRoundPairings(tournamentId: string, roundNumber?: number): Promise<PairingView[]> {
    let targetRound = roundNumber;
    if (!targetRound) {
      const tourney = await this.dbService.queryOne<any>(
        'SELECT current_round FROM tournaments WHERE id = ?',
        [tournamentId]
      );
      targetRound = tourney?.current_round || 1;
    }
    const finalRound = targetRound || 1;

    const rows = await this.dbService.queryAll<any>(
      `SELECT * FROM matches
       WHERE tournament_id = ? AND round_number = ?
       ORDER BY table_number ASC`,
      [tournamentId, finalRound]
    );

    const pairings: PairingView[] = [];

    for (const m of rows) {
      const p1 = await this.dbService.queryOne<any>(
        'SELECT * FROM players WHERE tournament_id = ? AND user_id = ?',
        [tournamentId, m.player1_id]
      );
      const p2 = await this.dbService.queryOne<any>(
        'SELECT * FROM players WHERE tournament_id = ? AND user_id = ?',
        [tournamentId, m.player2_id]
      );

      pairings.push({
        matchId: m.id,
        roundNumber: m.round_number,
        tableNumber: m.table_number,
        category: m.pod_category,
        player1: p1
          ? {
              userid: p1.user_id,
              firstName: p1.first_name,
              lastName: p1.last_name,
              fullName: p1.full_name
            }
          : null,
        player2: p2
          ? {
              userid: p2.user_id,
              firstName: p2.first_name,
              lastName: p2.last_name,
              fullName: p2.full_name
            }
          : null,
        status: m.status,
        confirmedWinnerId: m.confirmed_winner_id,
        isTie: Boolean(m.is_tie),
        tomOutcome: m.tom_outcome
      });
    }

    return pairings;
  }
}
