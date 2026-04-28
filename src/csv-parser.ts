import { ParsedCsv, RowMap } from './types';

/**
 * Parse a CSV string into an array of string arrays.
 * Handles RFC 4180: quoted fields with commas, newlines, and escaped quotes.
 */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  // Strip BOM if present
  if (content.charCodeAt(0) === 0xfeff) {
    i = 1;
  }

  while (i < content.length) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < content.length && content[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field.trim());
        field = '';
        i++;
      } else if (ch === '\r') {
        row.push(field.trim());
        field = '';
        rows.push(row);
        row = [];
        i++;
        if (i < content.length && content[i] === '\n') {
          i++;
        }
      } else if (ch === '\n') {
        row.push(field.trim());
        field = '';
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Handle last field/row
  if (field || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }

  // Remove trailing empty rows
  while (rows.length > 0 && rows[rows.length - 1].every(c => c === '')) {
    rows.pop();
  }

  return rows;
}

/**
 * Parse CSV content into headers + RowMap keyed by the 'id' column.
 * Rows with entirely blank cells or empty id values are skipped.
 */
export function parseCsvToRowMap(content: string): ParsedCsv {
  const rows = parseCsv(content);
  if (rows.length === 0) {
    return { headers: [], rows: {} };
  }

  const headers = rows[0];
  const idIndex = headers.indexOf('id');
  if (idIndex === -1) {
    return { headers, rows: {} };
  }

  const rowMap: RowMap = {};
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.every(cell => cell === '')) {
      continue;
    }

    const rowId = idIndex < row.length ? row[idIndex] : '';
    if (!rowId) {
      continue;
    }

    const rowDict: { [key: string]: string } = {};
    for (let c = 0; c < headers.length; c++) {
      rowDict[headers[c]] = c < row.length ? row[c] : '';
    }
    rowMap[rowId] = rowDict;
  }

  return { headers, rows: rowMap };
}

/**
 * Serialize a string[][] back to CSV content.
 * Quotes fields that contain commas, quotes, or newlines.
 */
export function serializeCsv(rows: string[][]): string {
  return rows
    .map(row =>
      row
        .map(field => {
          if (
            field.includes(',') ||
            field.includes('"') ||
            field.includes('\n') ||
            field.includes('\r')
          ) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        })
        .join(',')
    )
    .join('\n') + '\n';
}
