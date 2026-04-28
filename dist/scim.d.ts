import { ScimSetEvent, ScimEventType, CsvRow } from './types';
/**
 * Build a SCIM SET event payload.
 * For CREATE/UPDATE: data includes all columns except 'id'.
 * For DELETE: data contains only schemas.
 */
export declare function buildScimEvent(eventType: ScimEventType, entityName: string, rowId: string, rowData: CsvRow | null, iss: string, aud: string): ScimSetEvent;
