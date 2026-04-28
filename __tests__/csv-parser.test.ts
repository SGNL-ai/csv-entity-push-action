import { parseCsv, parseCsvToRowMap, serializeCsv } from '../src/csv-parser';

describe('parseCsv', () => {
  it('parses simple CSV', () => {
    const result = parseCsv('a,b,c\n1,2,3\n4,5,6\n');
    expect(result).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
      ['4', '5', '6'],
    ]);
  });

  it('handles quoted fields with commas', () => {
    const result = parseCsv('name,value,id\n"Smith, Jr.",hello,1\n');
    expect(result).toEqual([
      ['name', 'value', 'id'],
      ['Smith, Jr.', 'hello', '1'],
    ]);
  });

  it('handles escaped quotes', () => {
    const result = parseCsv('a,b\n"say ""hello""",val\n');
    expect(result).toEqual([
      ['a', 'b'],
      ['say "hello"', 'val'],
    ]);
  });

  it('handles CRLF line endings', () => {
    const result = parseCsv('a,b\r\n1,2\r\n');
    expect(result).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('handles BOM', () => {
    const result = parseCsv('\uFEFFa,b\n1,2\n');
    expect(result).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('handles empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });

  it('trims whitespace from fields', () => {
    const result = parseCsv(' a , b \n 1 , 2 \n');
    expect(result).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('handles DN template with embedded commas', () => {
    const result = parseCsv(
      'label,dn_template,id\ngroup,"OU=Team,OU=Groups,DC=test",abc-123\n'
    );
    expect(result).toEqual([
      ['label', 'dn_template', 'id'],
      ['group', 'OU=Team,OU=Groups,DC=test', 'abc-123'],
    ]);
  });
});

describe('parseCsvToRowMap', () => {
  it('returns rows keyed by id', () => {
    const result = parseCsvToRowMap('a,b,id\nv1,v2,id1\nv3,v4,id2\n');
    expect(result.headers).toEqual(['a', 'b', 'id']);
    expect(result.rows).toEqual({
      id1: { a: 'v1', b: 'v2', id: 'id1' },
      id2: { a: 'v3', b: 'v4', id: 'id2' },
    });
  });

  it('skips rows with empty id', () => {
    const result = parseCsvToRowMap('a,id\nv1,\nv2,id2\n');
    expect(Object.keys(result.rows)).toEqual(['id2']);
  });

  it('returns empty rows if no id column', () => {
    const result = parseCsvToRowMap('a,b\n1,2\n');
    expect(result.headers).toEqual(['a', 'b']);
    expect(result.rows).toEqual({});
  });

  it('handles empty content', () => {
    const result = parseCsvToRowMap('');
    expect(result).toEqual({ headers: [], rows: {} });
  });
});

describe('serializeCsv', () => {
  it('serializes simple rows', () => {
    const result = serializeCsv([
      ['a', 'b'],
      ['1', '2'],
    ]);
    expect(result).toBe('a,b\n1,2\n');
  });

  it('quotes fields with commas', () => {
    const result = serializeCsv([['a,b', 'c']]);
    expect(result).toBe('"a,b",c\n');
  });

  it('escapes quotes in fields', () => {
    const result = serializeCsv([['say "hi"', 'val']]);
    expect(result).toBe('"say ""hi""",val\n');
  });
});
