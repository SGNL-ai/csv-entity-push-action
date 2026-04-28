import {
  RowMap,
  RowChange,
  SCIM_EVENT_CREATE,
  SCIM_EVENT_UPDATE,
  SCIM_EVENT_DELETE,
} from './types';

/**
 * Compare old and new RowMaps (keyed by id) and produce a list of changes.
 */
export function computeRowChanges(
  oldRows: RowMap,
  newRows: RowMap
): RowChange[] {
  const changes: RowChange[] = [];

  // New or modified rows
  for (const rowId of Object.keys(newRows)) {
    if (!(rowId in oldRows)) {
      changes.push({
        eventType: SCIM_EVENT_CREATE,
        rowId,
        rowData: newRows[rowId],
      });
    } else {
      const oldData = oldRows[rowId];
      const newData = newRows[rowId];
      const allKeys = new Set([
        ...Object.keys(oldData),
        ...Object.keys(newData),
      ]);
      let changed = false;
      for (const key of allKeys) {
        if (key === 'id') continue;
        if ((oldData[key] ?? '') !== (newData[key] ?? '')) {
          changed = true;
          break;
        }
      }
      if (changed) {
        changes.push({
          eventType: SCIM_EVENT_UPDATE,
          rowId,
          rowData: newRows[rowId],
        });
      }
    }
  }

  // Deleted rows
  for (const rowId of Object.keys(oldRows)) {
    if (!(rowId in newRows)) {
      changes.push({
        eventType: SCIM_EVENT_DELETE,
        rowId,
        rowData: null,
      });
    }
  }

  return changes;
}
