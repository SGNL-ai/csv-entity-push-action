import * as core from '@actions/core';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { ActionInputs, GenerateIdsSummary } from './types';
import { parseCsv, serializeCsv } from './csv-parser';
import { listCsvFiles } from './git';

export async function runGenerateIds(
  inputs: ActionInputs
): Promise<GenerateIdsSummary> {
  const summary: GenerateIdsSummary = { filesModified: 0, idsGenerated: 0 };
  const files = await listCsvFiles(inputs.csvDirectory);

  if (files.length === 0) {
    core.info(`No CSV files found in ${inputs.csvDirectory}/. Nothing to do.`);
    return summary;
  }

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const rows = parseCsv(content);

    if (rows.length === 0) continue;

    const headers = rows[0];
    const idIndex = headers.indexOf('id');
    if (idIndex === -1) continue;

    let fileChanged = false;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.every(cell => cell === '')) continue;

      // Pad row if needed
      while (row.length <= idIndex) {
        row.push('');
      }

      if (!row[idIndex]) {
        row[idIndex] = randomUUID();
        fileChanged = true;
        summary.idsGenerated++;
        core.info(
          `  ${filePath}:${r + 1}: generated id ${row[idIndex]}`
        );
      }
    }

    if (fileChanged) {
      fs.writeFileSync(filePath, serializeCsv(rows));
      summary.filesModified++;
      core.info(`  Updated ${filePath} with generated IDs.`);
    }
  }

  core.info(
    `Done. Generated ${summary.idsGenerated} ID(s) across ${summary.filesModified} file(s).`
  );
  return summary;
}
