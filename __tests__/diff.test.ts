import { computeRowChanges } from '../src/diff';
import {
  SCIM_EVENT_CREATE,
  SCIM_EVENT_UPDATE,
  SCIM_EVENT_DELETE,
} from '../src/types';

describe('computeRowChanges', () => {
  it('detects all creates when old is empty', () => {
    const changes = computeRowChanges(
      {},
      {
        id1: { a: 'v1', id: 'id1' },
        id2: { a: 'v2', id: 'id2' },
      }
    );
    expect(changes).toHaveLength(2);
    expect(changes.every(c => c.eventType === SCIM_EVENT_CREATE)).toBe(true);
  });

  it('detects all deletes when new is empty', () => {
    const changes = computeRowChanges(
      {
        id1: { a: 'v1', id: 'id1' },
      },
      {}
    );
    expect(changes).toEqual([
      { eventType: SCIM_EVENT_DELETE, rowId: 'id1', rowData: null },
    ]);
  });

  it('detects updates when non-id columns differ', () => {
    const changes = computeRowChanges(
      { id1: { a: 'old', id: 'id1' } },
      { id1: { a: 'new', id: 'id1' } }
    );
    expect(changes).toEqual([
      {
        eventType: SCIM_EVENT_UPDATE,
        rowId: 'id1',
        rowData: { a: 'new', id: 'id1' },
      },
    ]);
  });

  it('returns no changes when rows are identical', () => {
    const row = { a: 'v1', id: 'id1' };
    expect(computeRowChanges({ id1: row }, { id1: { ...row } })).toEqual([]);
  });

  it('handles mixed creates, updates, and deletes', () => {
    const changes = computeRowChanges(
      {
        id1: { a: 'v1', id: 'id1' },
        id2: { a: 'old', id: 'id2' },
        id3: { a: 'v3', id: 'id3' },
      },
      {
        id2: { a: 'new', id: 'id2' },
        id4: { a: 'v4', id: 'id4' },
      }
    );
    const types = changes.map(c => c.eventType);
    expect(types).toContain(SCIM_EVENT_CREATE);
    expect(types).toContain(SCIM_EVENT_UPDATE);
    expect(types).toContain(SCIM_EVENT_DELETE);
    expect(changes.find(c => c.rowId === 'id4')?.eventType).toBe(
      SCIM_EVENT_CREATE
    );
    expect(changes.find(c => c.rowId === 'id2')?.eventType).toBe(
      SCIM_EVENT_UPDATE
    );
    expect(
      changes.filter(c => c.eventType === SCIM_EVENT_DELETE).map(c => c.rowId)
    ).toEqual(expect.arrayContaining(['id1', 'id3']));
  });
});
