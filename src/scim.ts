import { randomUUID } from 'crypto';
import {
  ScimSetEvent,
  ScimEventType,
  CsvRow,
  SCIM_EVENT_DELETE,
} from './types';

/**
 * Build a SCIM SET event payload.
 * For CREATE/UPDATE: data includes all columns except 'id'.
 * For DELETE: data contains only schemas.
 */
export function buildScimEvent(
  eventType: ScimEventType,
  entityName: string,
  rowId: string,
  rowData: CsvRow | null,
  iss: string,
  aud: string
): ScimSetEvent {
  const eventData: { schemas: string[]; [key: string]: string | string[] } = {
    schemas: [`urn:ietf:params:scim:schemas:core:2.0:${entityName}`],
  };

  if (rowData !== null && eventType !== SCIM_EVENT_DELETE) {
    for (const [key, value] of Object.entries(rowData)) {
      if (key !== 'id') {
        eventData[key] = value;
      }
    }
  }

  return {
    iss,
    iat: Math.floor(Date.now() / 1000),
    jti: randomUUID(),
    aud,
    sub_id: {
      format: 'scim',
      uri: `/${entityName}/${rowId}`,
      externalId: 'id',
      id: rowId,
    },
    events: {
      [eventType]: {
        data: eventData,
      },
    },
  };
}
