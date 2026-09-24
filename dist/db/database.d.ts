export type DatabaseSyncType = any;
export declare class DatabaseService {
    localDb?: DatabaseSyncType;
    private tursoClient?;
    isRemote: boolean;
    constructor(filePathOrUrl?: string, authToken?: string);
    get db(): DatabaseSyncType;
    queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
    queryAll<T = any>(sql: string, params?: any[]): Promise<T[]>;
    run(sql: string, params?: any[]): Promise<{
        changes: number;
        lastInsertRowid?: number | bigint;
    }>;
    exec(sql: string): Promise<void>;
    initSchema(): Promise<void>;
}
//# sourceMappingURL=database.d.ts.map