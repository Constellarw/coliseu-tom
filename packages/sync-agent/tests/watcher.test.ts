import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';
import { TomFileWatcher } from '../src/watcher.js';

describe('TOM File Watcher', () => {
  const testFile = resolve(__dirname, 'temp_test.tdf');

  beforeEach(() => {
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
  });

  afterEach(() => {
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
  });

  it('should detect file modification and invoke onUpdate callback with content', async () => {
    let receivedContent = '';
    const initialXml = '<tournament><data><name>Round 1</name></data></tournament>';
    writeFileSync(testFile, initialXml, 'utf-8');

    const watcher = new TomFileWatcher({
      filePath: testFile,
      debounceMs: 50,
      onUpdate: (content) => {
        receivedContent = content;
      }
    });

    watcher.start();

    // Wait 20ms and write updated content
    await new Promise(r => setTimeout(r, 20));
    const updatedXml = '<tournament><data><name>Round 2</name></data></tournament>';
    writeFileSync(testFile, updatedXml, 'utf-8');

    // Wait for debounce to fire
    await new Promise(r => setTimeout(r, 150));

    watcher.stop();

    expect(receivedContent).toBe(updatedXml);
  });
});
