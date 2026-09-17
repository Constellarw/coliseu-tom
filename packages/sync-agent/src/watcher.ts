import { watch, readFileSync, existsSync, FSWatcher } from 'fs';

export interface WatcherOptions {
  filePath: string;
  debounceMs?: number;
  onUpdate: (xmlContent: string) => void | Promise<void>;
  onError?: (error: Error) => void;
}

export class TomFileWatcher {
  private watcher: FSWatcher | null = null;
  private timer: NodeJS.Timeout | null = null;
  private lastHash: string = '';
  private isRunning: boolean = false;

  constructor(private options: WatcherOptions) {}

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    if (!existsSync(this.options.filePath)) {
      if (this.options.onError) {
        this.options.onError(new Error(`TDF file does not exist: ${this.options.filePath}`));
      }
      return;
    }

    // Read initial state
    try {
      this.lastHash = this.computeSimpleHash(readFileSync(this.options.filePath, 'utf-8'));
    } catch {
      // Ignored initially
    }

    this.watcher = watch(this.options.filePath, (eventType) => {
      if (eventType === 'change' || eventType === 'rename') {
        this.scheduleCheck();
      }
    });
  }

  private scheduleCheck(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    const debounce = this.options.debounceMs ?? 300;
    this.timer = setTimeout(() => {
      this.checkAndNotify();
    }, debounce);
  }

  private checkAndNotify(): void {
    if (!this.isRunning) return;

    try {
      if (!existsSync(this.options.filePath)) return;

      const content = readFileSync(this.options.filePath, 'utf-8');
      const hash = this.computeSimpleHash(content);

      if (hash !== this.lastHash && content.includes('<tournament')) {
        this.lastHash = hash;
        this.options.onUpdate(content);
      }
    } catch (err: any) {
      if (this.options.onError) {
        this.options.onError(err);
      }
    }
  }

  private computeSimpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
