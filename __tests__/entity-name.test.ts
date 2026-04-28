import { deriveEntityName } from '../src/entity-name';

describe('deriveEntityName', () => {
  it('extracts entity name after last dash', () => {
    expect(deriveEntityName('SOR Name-Entity1.csv')).toBe('Entity1');
  });

  it('removes spaces from entity name', () => {
    expect(deriveEntityName('SOR Name-Entity Name.csv')).toBe('EntityName');
  });

  it('uses last dash when multiple dashes', () => {
    expect(deriveEntityName('A-B-C.csv')).toBe('C');
  });

  it('handles no dash', () => {
    expect(deriveEntityName('NoHyphens.csv')).toBe('NoHyphens');
  });

  it('handles spaces with no dash', () => {
    expect(deriveEntityName('Some Name.csv')).toBe('SomeName');
  });
});
