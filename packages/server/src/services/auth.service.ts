import crypto from 'node:crypto';
import { DatabaseService } from '../db/database.js';

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

export function checkBirthDateMatch(input: string, stored: string): boolean {
  const inputNums = input.split(/[-/\s.]+/).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
  const storedNums = stored.split(/[-/\s.]+/).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));

  if (inputNums.length !== 3 || storedNums.length !== 3) {
    return false;
  }

  const inputYear = inputNums.find((n) => n >= 1900 && n <= 2100);
  const storedYear = storedNums.find((n) => n >= 1900 && n <= 2100);

  if (!inputYear || !storedYear || inputYear !== storedYear) {
    return false;
  }

  const inputRest = inputNums.filter((n) => n !== inputYear).sort((a, b) => a - b);
  const storedRest = storedNums.filter((n) => n !== storedYear).sort((a, b) => a - b);

  return inputRest[0] === storedRest[0] && inputRest[1] === storedRest[1];
}

export class AuthService {
  constructor(private dbService: DatabaseService) {}

  public async loginWithGoogle(payload: {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<{ user: UserRecord; token: string }> {
    const { googleId, email, name, picture } = payload;
    const now = new Date().toISOString();

    let user = await this.dbService.queryOne<UserRecord>(
      'SELECT * FROM users WHERE google_id = ? OR email = ? LIMIT 1',
      [googleId, email]
    );

    if (user) {
      await this.dbService.run(
        `UPDATE users
         SET google_id = ?, name = ?, picture = COALESCE(?, picture), updated_at = ?
         WHERE id = ?`,
        [googleId, name, picture || null, now, user.id]
      );
      user = await this.dbService.queryOne<UserRecord>('SELECT * FROM users WHERE id = ?', [user.id]);
    } else {
      const id = crypto.randomUUID();
      await this.dbService.run(
        `INSERT INTO users (id, google_id, email, name, picture, is_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        [id, googleId, email, name, picture || null, now, now]
      );
      user = await this.dbService.queryOne<UserRecord>('SELECT * FROM users WHERE id = ?', [id]);
    }

    const token = await this.createSession(user!.id);
    return { user: user!, token };
  }

  public async devLogin(payload: {
    email: string;
    name: string;
    popId?: string;
    picture?: string;
  }): Promise<{ user: UserRecord; token: string }> {
    const { email, name, popId, picture } = payload;
    const now = new Date().toISOString();
    const devGoogleId = `dev_${Buffer.from(email).toString('hex')}`;

    let user = await this.dbService.queryOne<UserRecord>(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (user) {
      if (popId && !user.pop_id) {
        await this.dbService.run(
          'UPDATE users SET pop_id = ?, is_verified = 1, updated_at = ? WHERE id = ?',
          [popId.trim(), now, user.id]
        );
      }
      user = await this.dbService.queryOne<UserRecord>('SELECT * FROM users WHERE id = ?', [user.id]);
    } else {
      const id = crypto.randomUUID();
      await this.dbService.run(
        `INSERT INTO users (id, google_id, email, name, picture, pop_id, is_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, devGoogleId, email, name, picture || null, popId ? popId.trim() : null, popId ? 1 : 0, now, now]
      );
      user = await this.dbService.queryOne<UserRecord>('SELECT * FROM users WHERE id = ?', [id]);
    }

    const token = await this.createSession(user!.id);
    return { user: user!, token };
  }

  public async createSession(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await this.dbService.run(
      `INSERT INTO user_sessions (token, user_id, expires_at)
       VALUES (?, ?, ?)`,
      [token, userId, expiresAt]
    );

    return token;
  }

  public async getUserByToken(token: string): Promise<UserRecord | null> {
    if (!token) return null;
    const now = new Date().toISOString();

    return this.dbService.queryOne<UserRecord>(
      `SELECT u.*
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = ? AND s.expires_at > ?
       LIMIT 1`,
      [token, now]
    );
  }

  public async bindPopId(userId: string, rawPopId: string, birthDate?: string): Promise<UserRecord> {
    const popId = rawPopId.trim();
    if (!popId) {
      throw new Error('POP ID não pode ser vazio');
    }

    // 1. Check if POP ID is already claimed by another user
    const existing = await this.dbService.queryOne<{ id: string; email: string; name: string }>(
      'SELECT id, email, name FROM users WHERE pop_id = ? AND id != ? LIMIT 1',
      [popId, userId]
    );

    if (existing) {
      throw new Error(`Este POP ID já está vinculado a outra conta (${existing.email}). Se este POP ID pertence a você, procure a organização da loja para desvincular.`);
    }

    const now = new Date().toISOString();
    await this.dbService.run(
      `UPDATE users
       SET pop_id = ?, birth_date = COALESCE(?, birth_date), is_verified = 1, updated_at = ?
       WHERE id = ?`,
      [popId, birthDate?.trim() || null, now, userId]
    );

    const user = await this.dbService.queryOne<UserRecord>('SELECT * FROM users WHERE id = ?', [userId]);
    return user!;
  }

  public async unbindPopIdByJudge(popId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.dbService.run(
      `UPDATE users
       SET pop_id = NULL, is_verified = 0, updated_at = ?
       WHERE pop_id = ?`,
      [now, popId.trim()]
    );
  }

  public async logout(token: string): Promise<void> {
    await this.dbService.run('DELETE FROM user_sessions WHERE token = ?', [token]);
  }
}
