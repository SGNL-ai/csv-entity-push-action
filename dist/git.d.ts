import { ParsedCsv } from './types';
/**
 * Determine the base commit SHA to diff against.
 * Resolution: beforeShaInput -> github.event.before -> HEAD~1 -> null
 */
export declare function getBaseRef(beforeShaInput: string): Promise<string | null>;
/**
 * Get list of changed CSV files under csvDirectory between baseRef and HEAD.
 */
export declare function getChangedCsvFiles(baseRef: string | null, csvDirectory: string): Promise<string[]>;
/**
 * Load and parse a CSV file at a specific git commit.
 * Returns empty ParsedCsv if the file does not exist at the commit.
 */
export declare function loadCsvAtCommit(commitRef: string, filePath: string): Promise<ParsedCsv>;
/**
 * List all CSV files in a directory on the filesystem.
 */
export declare function listCsvFiles(csvDirectory: string): Promise<string[]>;
