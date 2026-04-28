/**
 * Derive the SCIM entity name from a CSV filename.
 *
 * Strip .csv, find last '-', take text after it, remove spaces.
 * 'SOR Name-Entity1.csv' -> 'Entity1'
 * 'SOR Name-Entity Name.csv' -> 'EntityName'
 */
export declare function deriveEntityName(filename: string): string;
