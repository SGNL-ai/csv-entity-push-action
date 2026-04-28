import * as exec from '@actions/exec';
import * as path from 'path';
import * as fs from 'fs';
import { ParsedCsv, NULL_SHA } from './types';
import { parseCsvToRowMap } from './csv-parser';

/**
 * Execute a git command and return stdout.
 */
async function gitExec(
  args: string[],
  ignoreReturnCode = false
): Promise<{ exitCode: number; stdout: string }> {
  let stdout = '';
  const exitCode = await exec.exec('git', args, {
    silent: true,
    ignoreReturnCode,
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString();
      },
    },
  });
  return { exitCode, stdout };
}

/**
 * Determine the base commit SHA to diff against.
 * Resolution: beforeShaInput -> github.event.before -> HEAD~1 -> null
 */
export async function getBaseRef(
  beforeShaInput: string
): Promise<string | null> {
  // 1. Explicit input
  if (beforeShaInput && beforeShaInput !== NULL_SHA) {
    return beforeShaInput;
  }

  // 2. github.event.before from event payload
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath) {
    try {
      const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
      if (event.before && event.before !== NULL_SHA) {
        return event.before;
      }
    } catch {
      // ignore parse errors
    }
  }

  // 3. HEAD~1 fallback
  const { exitCode, stdout } = await gitExec(
    ['rev-parse', '--verify', 'HEAD~1'],
    true
  );
  if (exitCode === 0) {
    return stdout.trim();
  }

  return null;
}

/**
 * Get list of changed CSV files under csvDirectory between baseRef and HEAD.
 */
export async function getChangedCsvFiles(
  baseRef: string | null,
  csvDirectory: string
): Promise<string[]> {
  if (baseRef === null) {
    // Initial push: list all CSV files at HEAD
    const { stdout } = await gitExec([
      'ls-tree',
      '--name-only',
      '-r',
      'HEAD',
      '--',
      `${csvDirectory}/`,
    ]);
    return stdout
      .trim()
      .split('\n')
      .filter(f => f.endsWith('.csv') && f.length > 0);
  }

  // Changed files (added, modified, renamed, type-changed)
  const { stdout: changedOut } = await gitExec([
    'diff',
    '--name-only',
    '--diff-filter=AMDRT',
    baseRef,
    'HEAD',
    '--',
    `${csvDirectory}/`,
  ]);

  // Deleted files
  const { stdout: deletedOut } = await gitExec([
    'diff',
    '--name-only',
    '--diff-filter=D',
    baseRef,
    'HEAD',
    '--',
    `${csvDirectory}/`,
  ]);

  const files = new Set<string>();
  for (const line of changedOut.trim().split('\n')) {
    if (line.endsWith('.csv') && line.length > 0) files.add(line);
  }
  for (const line of deletedOut.trim().split('\n')) {
    if (line.endsWith('.csv') && line.length > 0) files.add(line);
  }

  return [...files];
}

/**
 * Load and parse a CSV file at a specific git commit.
 * Returns empty ParsedCsv if the file does not exist at the commit.
 */
export async function loadCsvAtCommit(
  commitRef: string,
  filePath: string
): Promise<ParsedCsv> {
  const { exitCode, stdout } = await gitExec(
    ['show', `${commitRef}:${filePath}`],
    true
  );
  if (exitCode !== 0) {
    return { headers: [], rows: {} };
  }
  return parseCsvToRowMap(stdout);
}

/**
 * List all CSV files in a directory on the filesystem.
 */
export async function listCsvFiles(csvDirectory: string): Promise<string[]> {
  if (!fs.existsSync(csvDirectory)) {
    return [];
  }
  const entries = fs.readdirSync(csvDirectory);
  return entries
    .filter(f => f.endsWith('.csv'))
    .sort()
    .map(f => path.join(csvDirectory, f));
}
