/**
 * Derive the SCIM entity name from a CSV filename.
 *
 * Strip .csv, find last '-', take text after it, remove spaces.
 * 'SOR Name-Entity1.csv' -> 'Entity1'
 * 'SOR Name-Entity Name.csv' -> 'EntityName'
 */
export function deriveEntityName(filename: string): string {
  let name = filename;
  if (name.endsWith('.csv')) {
    name = name.slice(0, -4);
  }
  const lastDash = name.lastIndexOf('-');
  if (lastDash === -1) {
    return name.replace(/ /g, '');
  }
  return name.slice(lastDash + 1).replace(/ /g, '');
}
