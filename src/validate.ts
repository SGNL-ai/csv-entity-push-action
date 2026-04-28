import * as core from '@actions/core';
import * as fs from 'fs';
import { ActionInputs, ValidationError } from './types';
import { parseCsv } from './csv-parser';
import { listCsvFiles } from './git';

export async function runValidate(
  inputs: ActionInputs
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const files = await listCsvFiles(inputs.csvDirectory);

  if (files.length === 0) {
    core.info(`No CSV files found in ${inputs.csvDirectory}/. Nothing to validate.`);
    return errors;
  }

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const rows = parseCsv(content);

    if (rows.length === 0) continue;

    const headers = rows[0];
    const idIndex = headers.indexOf('id');
    if (idIndex === -1) continue;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.every(cell => cell === '')) continue;

      const idVal = idIndex < row.length ? row[idIndex] : '';
      if (!idVal) {
        errors.push({
          file: filePath,
          row: r + 1,
          message: 'missing id value',
        });
      }
    }
  }

  if (errors.length > 0) {
    core.error(`Found CSV rows with missing id values:\n`);
    for (const err of errors) {
      core.error(`  ${err.file}:${err.row}: ${err.message}`);
    }
    core.setFailed(
      `${errors.length} row(s) missing IDs. Install the pre-commit hook to auto-generate them.`
    );
  } else {
    core.info('All CSV rows have id values.');
  }

  return errors;
}
