import { createRequire } from 'node:module';
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

export class DatabaseService {
  public db: DatabaseSyncType;

  constructor(filePath: string = ':memory:') {
    this.db = new DatabaseSync(filePath);
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT,
        state TEXT,
        country TEXT,
        organizer_name TEXT,
        organizer_pop_id TEXT,
        round_time INTEGER,
        start_date TEXT,
        current_round INTEGER DEFAULT 1,
        raw_tdf TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        full_name TEXT NOT NULL,
        birth_date TEXT,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
      );

      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        pod_category TEXT NOT NULL,
        round_number INTEGER NOT NULL,
        table_number INTEGER NOT NULL,
        player1_id TEXT NOT NULL,
        player2_id TEXT NOT NULL,
        tom_outcome TEXT DEFAULT '0',
        status TEXT DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, PENDING_CONFIRMATION, CONFIRMED, DISPUTED
        p1_reported_winner TEXT,
        p2_reported_winner TEXT,
        confirmed_winner_id TEXT,
        is_tie INTEGER DEFAULT 0,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
      );

      CREATE TABLE IF NOT EXISTS standings (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        pod_category TEXT NOT NULL,
        player_id TEXT NOT NULL,
        place INTEGER NOT NULL,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
      );

      CREATE INDEX IF NOT EXISTS idx_matches_tourney_round ON matches(tournament_id, round_number);
      CREATE INDEX IF NOT EXISTS idx_players_tourney_userid ON players(tournament_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_standings_tourney ON standings(tournament_id, pod_category);
    `);
  }
}
