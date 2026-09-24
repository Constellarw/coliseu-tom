import { DatabaseService } from '../db/database.js';

export interface ReportResultParams {
  matchId: string;
  reportingPlayerId: string;
  winnerId: string | null;
  isTie: boolean;
}

export interface JudgeOverrideParams {
  matchId: string;
  winnerId: string | null;
  isTie: boolean;
}

export interface MatchReportResult {
  matchId: string;
  status: 'IN_PROGRESS' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'DISPUTED';
  p1ReportedWinner: string | null;
  p2ReportedWinner: string | null;
  confirmedWinnerId: string | null;
  isTie: boolean;
  tomOutcome: string;
}

export class MatchReportService {
  constructor(private dbService: DatabaseService) {}

  public async reportResult(params: ReportResultParams): Promise<MatchReportResult> {
    const { matchId, reportingPlayerId, winnerId, isTie } = params;

    const match = await this.dbService.queryOne<any>('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (!match) {
      throw new Error(`Match not found: ${matchId}`);
    }

    const isP1 = match.player1_id === reportingPlayerId;
    const isP2 = match.player2_id === reportingPlayerId;

    if (!isP1 && !isP2) {
      throw new Error(`Player ${reportingPlayerId} is not a participant of match ${matchId}`);
    }

    const reportedValue = isTie ? 'EMPATE' : (winnerId || reportingPlayerId);
    let p1Report = isP1 ? reportedValue : match.p1_reported_winner;
    let p2Report = isP2 ? reportedValue : match.p2_reported_winner;

    let status: 'IN_PROGRESS' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'DISPUTED' = 'PENDING_CONFIRMATION';
    let confirmedWinnerId: string | null = null;
    let finalIsTie = 0;
    let tomOutcome = match.tom_outcome || '0';

    const isP1Tie = p1Report === 'TIE' || p1Report === 'EMPATE';
    const isP2Tie = p2Report === 'TIE' || p2Report === 'EMPATE';

    if (p1Report && p2Report) {
      if (p1Report === p2Report || (isP1Tie && isP2Tie)) {
        status = 'CONFIRMED';
        if (isP1Tie) {
          finalIsTie = 1;
          confirmedWinnerId = null;
          tomOutcome = '3';
        } else {
          finalIsTie = 0;
          confirmedWinnerId = p1Report;
          tomOutcome = (confirmedWinnerId === match.player1_id) ? '1' : '2';
        }
      } else {
        status = 'DISPUTED';
        confirmedWinnerId = null;
      }
    } else {
      status = 'PENDING_CONFIRMATION';
    }

    const now = new Date().toISOString();
    await this.dbService.run(
      `UPDATE matches
       SET status = ?,
           p1_reported_winner = ?,
           p2_reported_winner = ?,
           confirmed_winner_id = ?,
           is_tie = ?,
           tom_outcome = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        status,
        p1Report,
        p2Report,
        confirmedWinnerId,
        finalIsTie,
        tomOutcome,
        now,
        matchId
      ]
    );

    return {
      matchId,
      status,
      p1ReportedWinner: p1Report,
      p2ReportedWinner: p2Report,
      confirmedWinnerId,
      isTie: Boolean(finalIsTie),
      tomOutcome
    };
  }

  public async judgeOverride(params: JudgeOverrideParams): Promise<MatchReportResult> {
    const { matchId, winnerId, isTie } = params;

    const match = await this.dbService.queryOne<any>('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (!match) {
      throw new Error(`Match not found: ${matchId}`);
    }

    const status = 'CONFIRMED';
    const finalIsTie = isTie ? 1 : 0;
    const confirmedWinnerId = isTie ? null : winnerId;
    let tomOutcome = '0';

    if (isTie) {
      tomOutcome = '3';
    } else if (confirmedWinnerId) {
      tomOutcome = (confirmedWinnerId === match.player1_id) ? '1' : '2';
    }

    const now = new Date().toISOString();
    await this.dbService.run(
      `UPDATE matches
       SET status = ?,
           confirmed_winner_id = ?,
           is_tie = ?,
           tom_outcome = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        status,
        confirmedWinnerId,
        finalIsTie,
        tomOutcome,
        now,
        matchId
      ]
    );

    return {
      matchId,
      status,
      p1ReportedWinner: match.p1_reported_winner,
      p2ReportedWinner: match.p2_reported_winner,
      confirmedWinnerId,
      isTie: Boolean(finalIsTie),
      tomOutcome
    };
  }

  public async getReportQueue(tournamentId: string): Promise<any[]> {
    return this.dbService.queryAll(
      `SELECT m.*,
              p1.full_name as p1_name,
              p2.full_name as p2_name
       FROM matches m
       LEFT JOIN players p1 ON m.tournament_id = p1.tournament_id AND m.player1_id = p1.user_id
       LEFT JOIN players p2 ON m.tournament_id = p2.tournament_id AND m.player2_id = p2.user_id
       WHERE m.tournament_id = ?
         AND m.status IN ('PENDING_CONFIRMATION', 'CONFIRMED', 'DISPUTED')
       ORDER BY m.round_number DESC, m.table_number ASC`,
      [tournamentId]
    );
  }
}
