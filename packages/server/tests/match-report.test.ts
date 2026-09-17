import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DatabaseService } from '../src/db/database.js';
import { TournamentService } from '../src/services/tournament.service.js';
import { MatchReportService } from '../src/services/match-report.service.js';

describe('Match Report Service', () => {
  let db: DatabaseService;
  let tourneyService: TournamentService;
  let reportService: MatchReportService;

  beforeEach(() => {
    db = new DatabaseService(':memory:');
    tourneyService = new TournamentService(db);
    reportService = new MatchReportService(db);

    const fixturePath = resolve(__dirname, '../../tom-core/tests/fixtures/sample_tournament.tdf');
    const xmlContent = readFileSync(fixturePath, 'utf-8');
    tourneyService.ingestTdf('tourney-1', xmlContent);
  });

  it('should handle single player report with PENDING_CONFIRMATION', () => {
    const matchId = 'tourney-1_cat2_r1_t1';
    
    // Player 1 (Ash - 987654321) reports win
    const res = reportService.reportResult({
      matchId,
      reportingPlayerId: '987654321',
      winnerId: '987654321',
      isTie: false
    });

    expect(res.status).toBe('PENDING_CONFIRMATION');
    expect(res.p1ReportedWinner).toBe('987654321');
    expect(res.p2ReportedWinner).toBeNull();
    expect(res.confirmedWinnerId).toBeNull();
  });

  it('should auto-confirm match when both players report the same winner', () => {
    const matchId = 'tourney-1_cat2_r1_t1';

    // Player 1 reports Ash won
    reportService.reportResult({
      matchId,
      reportingPlayerId: '987654321',
      winnerId: '987654321',
      isTie: false
    });

    // Player 2 confirms Ash won
    const res2 = reportService.reportResult({
      matchId,
      reportingPlayerId: '876543219',
      winnerId: '987654321',
      isTie: false
    });

    expect(res2.status).toBe('CONFIRMED');
    expect(res2.confirmedWinnerId).toBe('987654321');
    expect(res2.tomOutcome).toBe('1'); // Player 1 won
  });

  it('should set DISPUTED status when players report conflicting results', () => {
    const matchId = 'tourney-1_cat2_r1_t1';

    // Player 1 reports Ash won
    reportService.reportResult({
      matchId,
      reportingPlayerId: '987654321',
      winnerId: '987654321',
      isTie: false
    });

    // Player 2 reports Gary won (conflict!)
    const res2 = reportService.reportResult({
      matchId,
      reportingPlayerId: '876543219',
      winnerId: '876543219',
      isTie: false
    });

    expect(res2.status).toBe('DISPUTED');
    expect(res2.confirmedWinnerId).toBeNull();
  });

  it('should allow judge override to resolve dispute', () => {
    const matchId = 'tourney-1_cat2_r1_t1';

    // Conflicting reports
    reportService.reportResult({
      matchId,
      reportingPlayerId: '987654321',
      winnerId: '987654321',
      isTie: false
    });
    reportService.reportResult({
      matchId,
      reportingPlayerId: '876543219',
      winnerId: '876543219',
      isTie: false
    });

    // Judge steps in and rules Gary won
    const overrideRes = reportService.judgeOverride({
      matchId,
      winnerId: '876543219',
      isTie: false
    });

    expect(overrideRes.status).toBe('CONFIRMED');
    expect(overrideRes.confirmedWinnerId).toBe('876543219');
    expect(overrideRes.tomOutcome).toBe('2'); // Player 2 won
  });
});
