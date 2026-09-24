export interface SyncClientConfig {
  serverUrl: string;
  tournamentId: string;
}

export class SyncClient {
  constructor(private config: SyncClientConfig) {}

  public async uploadTdf(xmlContent: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const url = `${this.config.serverUrl.replace(/\/$/, '')}/api/tournaments/${encodeURIComponent(this.config.tournamentId)}/upload`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        },
        body: xmlContent
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }
}
