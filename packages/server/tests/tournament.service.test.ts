import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DatabaseService } from '../src/db/database.js';
import { TournamentService } from '../src/services/tournament.service.js';

describe('Tournament Service', () => {
  let db: DatabaseService;
  let service: TournamentService;

  beforeEach(() => {
    // In-memory database for fast, isolated tests
    db = new DatabaseService(':memory:');
    service = new TournamentService(db);
  });

  it('should ingest tournament TDF and retrieve player current match by POP ID', () => {
    const fixturePath = resolve(__dirname, '../../tom-core/tests/fixtures/sample_tournament.tdf');
    const xmlContent = readFileSync(fixturePath, 'utf-8');

    const tournament = service.ingestTdf('tourney-1', xmlContent);
    expect(tournament.data.name).toBe('Test tournament');

    // Look up match for Ash Ketchum (POP ID 987654321)
    const matchAsh = service.getPlayerActiveMatch('tourney-1', '987654321');
    expect(matchAsh).toBeDefined();
    expect(matchAsh?.roundNumber).toBe(1);
    expect(matchAsh?.tableNumber).toBe(1);
    expect(matchAsh?.isPlayer1).toBe(true);
    expect(matchAsh?.opponent?.userid).toBe('876543219');
    expect(matchAsh?.opponent?.fullName).toBe('Gary Oak');

    // Look up match for Gary Oak (POP ID 876543219)
    const matchGary = service.getPlayerActiveMatch('tourney-1', '876543219');
    expect(matchGary).toBeDefined();
    expect(matchGary?.roundNumber).toBe(1);
    expect(matchGary?.tableNumber).toBe(1);
    expect(matchGary?.isPlayer1).toBe(false);
    expect(matchGary?.opponent?.userid).toBe('987654321');
    expect(matchGary?.opponent?.fullName).toBe('Ash Ketchum');

    // Standings check
    const standings = service.getStandings('tourney-1');
    expect(standings.length).toBe(2);
    expect(standings[0].place).toBe(1);
    expect(standings[0].player.fullName).toBe('Ash Ketchum');
    expect(standings[1].place).toBe(2);
    expect(standings[1].player.fullName).toBe('Gary Oak');
  });

  it('should return all pairings for the current round', () => {
    const fixturePath = resolve(__dirname, '../../tom-core/tests/fixtures/sample_tournament.tdf');
    const xmlContent = readFileSync(fixturePath, 'utf-8');

    service.ingestTdf('tourney-1', xmlContent);

    const pairings = service.getRoundPairings('tourney-1', 1);
    expect(pairings.length).toBe(1);
    expect(pairings[0].tableNumber).toBe(1);
    expect(pairings[0].player1?.fullName).toBe('Ash Ketchum');
    expect(pairings[0].player2?.fullName).toBe('Gary Oak');
  });
});
