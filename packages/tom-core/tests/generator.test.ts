import { describe, it, expect } from 'vitest';
import { generateTdfXml } from '../src/generator';
import { parseTdf } from '../src/parser';
import { TournamentConfig, RegisteredPlayer } from '../src/types';

describe('TDF XML Generator', () => {
  it('should generate valid TDF XML from registered players and tournament config', () => {
    const config: TournamentConfig = {
      organizerName: 'Elite Four Games',
      organizerPopId: '1234567',
      tournamentName: 'Saturday League Cup',
      city: 'Curitiba',
      country: 'Brazil'
    };

    const players: RegisteredPlayer[] = [
      { playerId: '90001', fullName: 'Red Oak', birthYear: '1995' },
      { playerId: '90002', fullName: 'Blue Oak', birthYear: '1996' },
      { playerId: '90003', fullName: 'Green Leaf', birthYear: '2010' }
    ];

    const xml = generateTdfXml(config, players);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<tournament type="2" stage="1" version="1.80" gametype="TRADING_CARD_GAME" mode="LEAGUECHALLENGE">');
    expect(xml).toContain('<name>Saturday League Cup</name>');
    expect(xml).toContain('popid="1234567" name="Elite Four Games"');
    expect(xml).toContain('<player userid="90001">');
    expect(xml).toContain('<firstname>Red</firstname>');
    expect(xml).toContain('<lastname>Oak</lastname>');

    // Validate that the generated XML can be parsed by parseTdf
    const parsed = parseTdf(xml);
    expect(parsed.data.name).toBe('Saturday League Cup');
    expect(parsed.data.organizerName).toBe('Elite Four Games');
    expect(parsed.data.organizerPopId).toBe('1234567');
    expect(Object.keys(parsed.players).length).toBe(3);
    expect(parsed.players['90001'].firstName).toBe('Red');
    expect(parsed.players['90001'].lastName).toBe('Oak');
    expect(parsed.players['90003'].fullName).toBe('Green Leaf');
  });

  it('should properly escape XML special characters in player and tournament names', () => {
    const config: TournamentConfig = {
      organizerName: 'Card & Board <Games>',
      organizerPopId: '999',
      tournamentName: 'Champion\'s "Special" & Draft'
    };

    const players: RegisteredPlayer[] = [
      { playerId: '777', fullName: 'Jack "The King" & O\'Neill' }
    ];

    const xml = generateTdfXml(config, players);

    expect(xml).toContain('&amp;');
    expect(xml).toContain('&quot;');
    expect(xml).not.toContain('<Games>');

    const parsed = parseTdf(xml);
    expect(parsed.data.name).toBe('Champion\'s "Special" & Draft');
    expect(parsed.data.organizerName).toBe('Card & Board <Games>');
    expect(parsed.players['777'].fullName).toBe('Jack "The King" & O\'Neill');
  });
});
