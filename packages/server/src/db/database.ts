import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createClient, type Client } from '@libsql/client/web';

export type DatabaseSyncType = any;

let DatabaseSyncClass: any = null;
try {
  const req = createRequire(import.meta.url);
  DatabaseSyncClass = req('node:sqlite')?.DatabaseSync;
} catch {
  // node:sqlite is available in Node 22.5+. In serverless / Vercel, Turso is used instead.
}

const SCHEMA_SQL = `
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
    birth_date TEXT
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
    status TEXT DEFAULT 'IN_PROGRESS',
    p1_reported_winner TEXT,
    p2_reported_winner TEXT,
    confirmed_winner_id TEXT,
    is_tie INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS standings (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    pod_category TEXT NOT NULL,
    player_id TEXT NOT NULL,
    place INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    picture TEXT,
    pop_id TEXT UNIQUE,
    birth_date TEXT,
    is_verified INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_matches_tourney_round ON matches(tournament_id, round_number);
  CREATE INDEX IF NOT EXISTS idx_players_tourney_userid ON players(tournament_id, user_id);
  CREATE INDEX IF NOT EXISTS idx_standings_tourney ON standings(tournament_id, pod_category);
  CREATE INDEX IF NOT EXISTS idx_users_popid ON users(pop_id);
  CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
`;

export class DatabaseService {
  public localDb?: DatabaseSyncType;
  private tursoClient?: Client;
  public isRemote = false;

  constructor(filePathOrUrl?: string, authToken?: string) {
    const tursoUrl =
      process.env.TURSO_DATABASE_URL ||
      (filePathOrUrl?.startsWith('libsql://') || filePathOrUrl?.startsWith('https://')
        ? filePathOrUrl
        : undefined);
    const token = process.env.TURSO_AUTH_TOKEN || authToken;

    if (tursoUrl) {
      this.isRemote = true;
      this.tursoClient = createClient({
        url: tursoUrl,
        authToken: token
      });
    } else {
      const filePath = filePathOrUrl || './data/tournament.db';
      if (filePath !== ':memory:') {
        try {
          mkdirSync(dirname(filePath), { recursive: true });
        } catch {
          // Directory already exists or path is in cwd
        }
      }
      if (!DatabaseSyncClass) {
        throw new Error('Local SQLite requer Node.js 22.5+ ou defina TURSO_DATABASE_URL para usar banco remoto.');
      }
      this.localDb = new DatabaseSyncClass(filePath);
      this.localDb!.exec(SCHEMA_SQL);
    }
  }

  // Direct sync access for backwards compatibility when running locally
  public get db(): DatabaseSyncType {
    if (this.localDb) return this.localDb;
    throw new Error(
      'Direct sync access to db is not available when running in remote Turso mode. Use async methods (queryOne, queryAll, run, exec) instead.'
    );
  }

  public async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (this.tursoClient) {
      const rs = await this.tursoClient.execute({ sql, args: params });
      return (rs.rows[0] as unknown as T) || null;
    }
    const row = this.localDb!.prepare(sql).get(...params);
    return (row as unknown as T) || null;
  }

  public async queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (this.tursoClient) {
      const rs = await this.tursoClient.execute({ sql, args: params });
      return rs.rows as unknown as T[];
    }
    const rows = this.localDb!.prepare(sql).all(...params);
    return rows as unknown as T[];
  }

  public async run(
    sql: string,
    params: any[] = []
  ): Promise<{ changes: number; lastInsertRowid?: number | bigint }> {
    if (this.tursoClient) {
      const rs = await this.tursoClient.execute({ sql, args: params });
      return { changes: rs.rowsAffected, lastInsertRowid: rs.lastInsertRowid };
    }
    const res = this.localDb!.prepare(sql).run(...params) as any;
    return { changes: res.changes ?? 1, lastInsertRowid: res.lastInsertRowid };
  }

  public async exec(sql: string): Promise<void> {
    if (this.tursoClient) {
      await this.tursoClient.executeMultiple(sql);
      return;
    }
    this.localDb!.exec(sql);
  }

  public async initSchema(): Promise<void> {
    await this.exec(SCHEMA_SQL);
  }
}
