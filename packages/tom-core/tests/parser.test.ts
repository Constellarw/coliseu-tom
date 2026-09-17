import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseTdf } from '../src/parser';
import { MatchOutcome } from '../src/types';

describe('TDF Parser', () => {
  it('should parse a valid TOM .tdf XML file into TournamentData structure', () => {
    const fixturePath = resolve(__dirname, 'fixtures/sample_tournament.tdf');
    const xmlContent = readFileSync(fixturePath, 'utf-8');

    const result = parseTdf(xmlContent);

    // Verify root & metadata
    expect(result.version).toBe('1.80');
    expect(result.gametype).toBe('TRADING_CARD_GAME');
    expect(result.data.name).toBe('Test tournament');
    expect(result.data.organizerName).toBe('Test Organizer');
    expect(result.data.organizerPopId).toBe('999999');
    expect(result.data.roundTimeMinutes).toBe(30);

    // Verify players
    expect(Object.keys(result.players).length).toBe(3);
    const ash = result.players['987654321'];
    expect(ash).toBeDefined();
    expect(ash.firstName).toBe('Ash');
    expect(ash.lastName).toBe('Ketchum');
    expect(ash.fullName).toBe('Ash Ketchum');
    expect(ash.userid).toBe('987654321');

    // Verify pods
    expect(result.pods.length).toBe(1);
    const pod = result.pods[0];
    expect(pod.category).toBe('2');
    expect(pod.categoryName).toBe('Master');
    expect(pod.rounds.length).toBe(1);

    // Verify round and match
    const round1 = pod.rounds[0];
    expect(round1.number).toBe(1);
    expect(round1.matches.length).toBe(1);

    const match = round1.matches[0];
    expect(match.tableNumber).toBe(1);
    expect(match.player1Id).toBe('987654321');
    expect(match.player2Id).toBe('876543219');
    expect(match.outcome).toBe(MatchOutcome.WIN_PLAYER_1);
    expect(match.outcomeDescription).toBe('Player 1 Won');

    // Verify standings
    expect(result.standings.length).toBe(1);
    expect(result.standings[0].categoryName).toBe('Master');
    expect(result.standings[0].rankings[0].playerId).toBe('987654321');
    expect(result.standings[0].rankings[0].place).toBe(1);
  });

  it('should correctly parse tie outcome and geographic metadata', () => {
    const fixturePath = resolve(__dirname, 'fixtures/full_tournament.tdf');
    const xmlContent = readFileSync(fixturePath, 'utf-8');

    const result = parseTdf(xmlContent);

    expect(result.data.name).toBe('Regional Test');
    expect(result.data.country).toBe('Brazil');
    expect(result.data.city).toBe('Sao Paulo');

    const match = result.pods[0].rounds[0].matches[0];
    expect(match.outcome).toBe(MatchOutcome.TIE);
    expect(match.outcomeDescription).toBe('Tie');
  });
});
