import { ParsedCsv } from './types';
/**
 * Parse a CSV string into an array of string arrays.
 * Handles RFC 4180: quoted fields with commas, newlines, and escaped quotes.
 */
export declare function parseCsv(content: string): string[][];
/**
 * Parse CSV content into headers + RowMap keyed by the 'id' column.
 * Rows with entirely blank cells or empty id values are skipped.
 */
export declare function parseCsvToRowMap(content: string): ParsedCsv;
/**
 * Serialize a string[][] back to CSV content.
 * Quotes fields that contain commas, quotes, or newlines.
 */
export declare function serializeCsv(rows: string[][]): string;
