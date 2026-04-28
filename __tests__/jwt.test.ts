import { jwtEncode, base64url } from '../src/jwt';
import { createHmac } from 'crypto';

describe('base64url', () => {
  it('encodes without padding', () => {
    const result = base64url(Buffer.from('test'));
    expect(result).not.toContain('=');
    expect(result).toBe('dGVzdA');
  });
});

describe('jwtEncode', () => {
  it('produces three dot-separated segments', () => {
    const token = jwtEncode({ foo: 'bar' }, 'secret');
    expect(token.split('.')).toHaveLength(3);
  });

  it('has correct header', () => {
    const token = jwtEncode({ foo: 'bar' }, 'secret');
    const headerB64 = token.split('.')[0];
    const header = JSON.parse(
      Buffer.from(headerB64, 'base64url').toString()
    );
    expect(header).toEqual({ alg: 'HS256', typ: 'secevent+jwt' });
  });

  it('has correct payload', () => {
    const payload = { iss: 'test', aud: 'aud' };
    const token = jwtEncode(payload, 'secret');
    const payloadB64 = token.split('.')[1];
    const decoded = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString()
    );
    expect(decoded).toEqual(payload);
  });

  it('signature verifies with same secret', () => {
    const token = jwtEncode({ foo: 'bar' }, 'my-secret');
    const parts = token.split('.');
    const signingInput = `${parts[0]}.${parts[1]}`;
    const expectedSig = createHmac('sha256', 'my-secret')
      .update(signingInput)
      .digest('base64url');
    expect(parts[2]).toBe(expectedSig);
  });
});
