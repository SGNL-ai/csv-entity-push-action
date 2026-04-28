import { buildScimEvent } from '../src/scim';
import {
  SCIM_EVENT_CREATE,
  SCIM_EVENT_UPDATE,
  SCIM_EVENT_DELETE,
} from '../src/types';

describe('buildScimEvent', () => {
  it('builds CREATE event with all non-id columns', () => {
    const event = buildScimEvent(
      SCIM_EVENT_CREATE,
      'Entity1',
      'abc-123',
      { attr1: 'v1', attr2: 'v2', id: 'abc-123' },
      'test-iss',
      'test-aud'
    );
    expect(event.iss).toBe('test-iss');
    expect(event.aud).toBe('test-aud');
    expect(event.sub_id.format).toBe('scim');
    expect(event.sub_id.uri).toBe('/Entity1/abc-123');
    expect(event.sub_id.id).toBe('abc-123');
    expect(event.jti).toBeTruthy();
    expect(event.iat).toBeGreaterThan(0);

    const data = event.events[SCIM_EVENT_CREATE].data;
    expect(data.schemas).toEqual([
      'urn:ietf:params:scim:schemas:core:2.0:Entity1',
    ]);
    expect(data['attr1']).toBe('v1');
    expect(data['attr2']).toBe('v2');
    expect(data['id']).toBeUndefined();
  });

  it('builds UPDATE event with all non-id columns', () => {
    const event = buildScimEvent(
      SCIM_EVENT_UPDATE,
      'Entity1',
      'abc-123',
      { attr1: 'new', id: 'abc-123' },
      'iss',
      'aud'
    );
    const data = event.events[SCIM_EVENT_UPDATE].data;
    expect(data['attr1']).toBe('new');
    expect(data['id']).toBeUndefined();
  });

  it('builds DELETE event with only schemas', () => {
    const event = buildScimEvent(
      SCIM_EVENT_DELETE,
      'Entity1',
      'abc-123',
      null,
      'iss',
      'aud'
    );
    const data = event.events[SCIM_EVENT_DELETE].data;
    expect(data.schemas).toEqual([
      'urn:ietf:params:scim:schemas:core:2.0:Entity1',
    ]);
    expect(Object.keys(data)).toEqual(['schemas']);
  });
});
