import { TomFileWatcher } from './watcher.js';
import { SyncClient } from './client.js';

export * from './watcher.js';
export * from './client.js';

function printUsage() {
  console.log(`
Pokemon TOM Sync Agent (Daemon)
Usage:
  tom-sync --file <path-to-tdf> --url <server-url> --tournament <tournament-id>

Options:
  --file, -f         Path to local tournament .tdf file
  --url, -u          Remote server base URL (e.g. https://mytournament.com or http://localhost:3001)
  --tournament, -t   Tournament identifier in the cloud system
  --debounce, -d     Debounce delay in ms (default: 300)
  --help, -h         Show this message
`);
}

export function runCli(args: string[]) {
  let filePath = '';
  let serverUrl = 'http://localhost:3001';
  let tournamentId = 'default';
  let debounceMs = 300;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--file' || arg === '-f') {
      filePath = args[++i] || '';
    } else if (arg === '--url' || arg === '-u') {
      serverUrl = args[++i] || serverUrl;
    } else if (arg === '--tournament' || arg === '-t') {
      tournamentId = args[++i] || tournamentId;
    } else if (arg === '--debounce' || arg === '-d') {
      debounceMs = Number(args[++i] || debounceMs);
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      return;
    }
  }

  if (!filePath) {
    console.error('Error: --file <path-to-tdf> is required.');
    printUsage();
    process.exit(1);
  }

  console.log(`[TOM Sync Agent] Starting...`);
  console.log(`Watching file: ${filePath}`);
  console.log(`Target URL:    ${serverUrl}`);
  console.log(`Tournament ID: ${tournamentId}`);

  const client = new SyncClient({ serverUrl, tournamentId });
  const watcher = new TomFileWatcher({
    filePath,
    debounceMs,
    onUpdate: async (xmlContent) => {
      console.log(`[TOM Sync Agent] File update detected at ${new Date().toLocaleTimeString()}. Syncing to cloud...`);
      const res = await client.uploadTdf(xmlContent);
      if (res.success) {
        console.log(`[TOM Sync Agent] Successfully synced tournament to ${serverUrl}`);
      } else {
        console.error(`[TOM Sync Agent] Sync failed: ${res.error}`);
      }
    },
    onError: (err) => {
      console.error(`[TOM Sync Agent] Watcher error: ${err.message}`);
    }
  });

  watcher.start();
  console.log(`[TOM Sync Agent] Monitoring active. Press Ctrl+C to exit.`);

  process.on('SIGINT', () => {
    console.log(`[TOM Sync Agent] Stopping watcher...`);
    watcher.stop();
    process.exit(0);
  });
}

// Auto-run if executed from command line
if (process.argv[1] && (process.argv[1].endsWith('index.js') || process.argv[1].endsWith('tom-sync'))) {
  runCli(process.argv.slice(2));
}
