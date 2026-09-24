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
export declare function checkBirthDateMatch(input: string, stored: string): boolean;
export declare class AuthService {
    private dbService;
    constructor(dbService: DatabaseService);
    loginWithGoogle(payload: {
        googleId: string;
        email: string;
        name: string;
        picture?: string;
    }): Promise<{
        user: UserRecord;
        token: string;
    }>;
    devLogin(payload: {
        email: string;
        name: string;
        popId?: string;
        picture?: string;
    }): Promise<{
        user: UserRecord;
        token: string;
    }>;
    createSession(userId: string): Promise<string>;
    getUserByToken(token: string): Promise<UserRecord | null>;
    bindPopId(userId: string, rawPopId: string, birthDate?: string): Promise<UserRecord>;
    unbindPopIdByJudge(popId: string): Promise<void>;
    logout(token: string): Promise<void>;
}
//# sourceMappingURL=auth.service.d.ts.map