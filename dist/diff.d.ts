import { RowMap, RowChange } from './types';
/**
 * Compare old and new RowMaps (keyed by id) and produce a list of changes.
 */
export declare function computeRowChanges(oldRows: RowMap, newRows: RowMap): RowChange[];
