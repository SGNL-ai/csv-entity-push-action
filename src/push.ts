import * as core from '@actions/core';
import * as path from 'path';
import {
  ActionInputs,
  PushSummary,
  SCIM_EVENT_CREATE,
  SCIM_EVENT_UPDATE,
  SCIM_EVENT_DELETE,
} from './types';
import { getBaseRef, getChangedCsvFiles, loadCsvAtCommit } from './git';
import { computeRowChanges } from './diff';
import { deriveEntityName } from './entity-name';
import { buildScimEvent } from './scim';
import { jwtEncode } from './jwt';
import { postEvent } from './http';

export async function runPush(inputs: ActionInputs): Promise<PushSummary> {
  const summary: PushSummary = {
    totalEvents: 0,
    successCount: 0,
    failureCount: 0,
    filesProcessed: 0,
  };

  // Validate required inputs
  const missing: string[] = [];
  if (!inputs.entityPushUrl) missing.push('entity-push-url');
  if (!inputs.entityPushIss) missing.push('entity-push-iss');
  if (!inputs.entityPushAud) missing.push('entity-push-aud');
  if (!inputs.entityPushToken) missing.push('entity-push-token');

  if (missing.length > 0) {
    core.setFailed(
      `Missing required inputs for push mode: ${missing.join(', ')}`
    );
    return summary;
  }

  const baseRef = await getBaseRef(inputs.beforeSha);
  const changedFiles = await getChangedCsvFiles(
    baseRef,
    inputs.csvDirectory
  );

  if (changedFiles.length === 0) {
    core.info('No changed CSV files detected. Nothing to do.');
    return summary;
  }

  for (const filePath of changedFiles.sort()) {
    const filename = path.basename(filePath);
    const entityName = deriveEntityName(filename);
    core.info(`\nProcessing: ${filePath} -> entity: ${entityName}`);

    const oldCsv = baseRef
      ? await loadCsvAtCommit(baseRef, filePath)
      : { headers: [], rows: {} };
    const newCsv = await loadCsvAtCommit('HEAD', filePath);

    if (
      Object.keys(oldCsv.rows).length === 0 &&
      Object.keys(newCsv.rows).length === 0
    ) {
      core.info("  Skipping: no rows with 'id' column found.");
      continue;
    }

    const changes = computeRowChanges(oldCsv.rows, newCsv.rows);
    if (changes.length === 0) {
      core.info('  No row-level changes detected.');
      continue;
    }

    summary.filesProcessed++;
    const createCount = changes.filter(
      c => c.eventType === SCIM_EVENT_CREATE
    ).length;
    const updateCount = changes.filter(
      c => c.eventType === SCIM_EVENT_UPDATE
    ).length;
    const deleteCount = changes.filter(
      c => c.eventType === SCIM_EVENT_DELETE
    ).length;
    core.info(
      `  Found ${changes.length} change(s): ${createCount} create, ${updateCount} update, ${deleteCount} delete`
    );

    for (const change of changes) {
      const event = buildScimEvent(
        change.eventType,
        entityName,
        change.rowId,
        change.rowData,
        inputs.entityPushIss,
        inputs.entityPushAud
      );
      const shortType = change.eventType.split(':').pop() ?? '';
      core.info(`  Sending ${shortType} for id=${change.rowId}`);

      const jwt = jwtEncode(event, inputs.entityPushToken);
      const result = await postEvent(
        jwt,
        inputs.entityPushUrl,
        inputs.entityPushToken,
        event.sub_id.uri
      );

      summary.totalEvents++;
      if (result.success) {
        core.info(`  POST ${result.uri} -> ${result.statusCode}`);
        summary.successCount++;
      } else {
        core.error(`  POST ${result.uri} -> ${result.error}`);
        summary.failureCount++;
      }
    }
  }

  core.info(
    `\nDone. Sent ${summary.totalEvents} event(s). Errors: ${summary.failureCount > 0 ? 'yes' : 'none'}.`
  );

  if (summary.failureCount > 0) {
    core.setFailed(
      `${summary.failureCount} event(s) failed to send.`
    );
  }

  return summary;
}
