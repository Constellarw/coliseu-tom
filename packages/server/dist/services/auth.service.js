import crypto from 'node:crypto';
export function checkBirthDateMatch(input, stored) {
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
    dbService;
    constructor(dbService) {
        this.dbService = dbService;
    }
    async loginWithGoogle(payload) {
        const { googleId, email, name, picture } = payload;
        const now = new Date().toISOString();
        let user = await this.dbService.queryOne('SELECT * FROM users WHERE google_id = ? OR email = ? LIMIT 1', [googleId, email]);
        if (user) {
            await this.dbService.run(`UPDATE users
         SET google_id = ?, name = ?, picture = COALESCE(?, picture), updated_at = ?
         WHERE id = ?`, [googleId, name, picture || null, now, user.id]);
            user = await this.dbService.queryOne('SELECT * FROM users WHERE id = ?', [user.id]);
        }
        else {
            const id = crypto.randomUUID();
            await this.dbService.run(`INSERT INTO users (id, google_id, email, name, picture, is_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`, [id, googleId, email, name, picture || null, now, now]);
            user = await this.dbService.queryOne('SELECT * FROM users WHERE id = ?', [id]);
        }
        const token = await this.createSession(user.id);
        return { user: user, token };
    }
    async devLogin(payload) {
        const { email, name, popId, picture } = payload;
        const now = new Date().toISOString();
        const devGoogleId = `dev_${Buffer.from(email).toString('hex')}`;
        let user = await this.dbService.queryOne('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
        if (user) {
            if (popId && !user.pop_id) {
                await this.dbService.run('UPDATE users SET pop_id = ?, is_verified = 1, updated_at = ? WHERE id = ?', [popId.trim(), now, user.id]);
            }
            user = await this.dbService.queryOne('SELECT * FROM users WHERE id = ?', [user.id]);
        }
        else {
            const id = crypto.randomUUID();
            await this.dbService.run(`INSERT INTO users (id, google_id, email, name, picture, pop_id, is_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, devGoogleId, email, name, picture || null, popId ? popId.trim() : null, popId ? 1 : 0, now, now]);
            user = await this.dbService.queryOne('SELECT * FROM users WHERE id = ?', [id]);
        }
        const token = await this.createSession(user.id);
        return { user: user, token };
    }
    async createSession(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await this.dbService.run(`INSERT INTO user_sessions (token, user_id, expires_at)
       VALUES (?, ?, ?)`, [token, userId, expiresAt]);
        return token;
    }
    async getUserByToken(token) {
        if (!token)
            return null;
        const now = new Date().toISOString();
        return this.dbService.queryOne(`SELECT u.*
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = ? AND s.expires_at > ?
       LIMIT 1`, [token, now]);
    }
    async bindPopId(userId, rawPopId, birthDate) {
        const popId = rawPopId.trim();
        if (!popId) {
            throw new Error('POP ID não pode ser vazio');
        }
        // 1. Check if POP ID is already claimed by another user
        const existing = await this.dbService.queryOne('SELECT id, email, name FROM users WHERE pop_id = ? AND id != ? LIMIT 1', [popId, userId]);
        if (existing) {
            throw new Error(`Este POP ID já está vinculado a outra conta (${existing.email}). Se este POP ID pertence a você, procure a organização da loja para desvincular.`);
        }
        const now = new Date().toISOString();
        await this.dbService.run(`UPDATE users
       SET pop_id = ?, birth_date = COALESCE(?, birth_date), is_verified = 1, updated_at = ?
       WHERE id = ?`, [popId, birthDate?.trim() || null, now, userId]);
        const user = await this.dbService.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
        return user;
    }
    async unbindPopIdByJudge(popId) {
        const now = new Date().toISOString();
        await this.dbService.run(`UPDATE users
       SET pop_id = NULL, is_verified = 0, updated_at = ?
       WHERE pop_id = ?`, [now, popId.trim()]);
    }
    async logout(token) {
        await this.dbService.run('DELETE FROM user_sessions WHERE token = ?', [token]);
    }
}
//# sourceMappingURL=auth.service.js.map