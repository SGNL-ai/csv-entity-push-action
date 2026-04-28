export declare const SCIM_EVENT_CREATE: "urn:ietf:params:SCIM:event:prov:create:full";
export declare const SCIM_EVENT_UPDATE: "urn:ietf:params:SCIM:event:prov:put:full";
export declare const SCIM_EVENT_DELETE: "urn:ietf:params:SCIM:event:prov:delete";
export type ScimEventType = typeof SCIM_EVENT_CREATE | typeof SCIM_EVENT_UPDATE | typeof SCIM_EVENT_DELETE;
export interface CsvRow {
    [column: string]: string;
}
export interface RowMap {
    [id: string]: CsvRow;
}
export interface ParsedCsv {
    headers: string[];
    rows: RowMap;
}
export interface RowChange {
    eventType: ScimEventType;
    rowId: string;
    rowData: CsvRow | null;
}
export interface ScimSetEvent {
    iss: string;
    iat: number;
    jti: string;
    aud: string;
    sub_id: {
        format: 'scim';
        uri: string;
        externalId: 'id';
        id: string;
    };
    events: {
        [eventTypeUrn: string]: {
            data: {
                schemas: string[];
                [attribute: string]: string | string[];
            };
        };
    };
}
export interface PostResult {
    success: boolean;
    statusCode?: number;
    error?: string;
    uri: string;
}
export interface ActionInputs {
    mode: 'push' | 'validate' | 'generate-ids';
    csvDirectory: string;
    entityPushUrl: string;
    entityPushIss: string;
    entityPushAud: string;
    entityPushToken: string;
    beforeSha: string;
}
export interface PushSummary {
    totalEvents: number;
    successCount: number;
    failureCount: number;
    filesProcessed: number;
}
export interface ValidationError {
    file: string;
    row: number;
    message: string;
}
export interface GenerateIdsSummary {
    filesModified: number;
    idsGenerated: number;
}
export declare const NULL_SHA: string;
