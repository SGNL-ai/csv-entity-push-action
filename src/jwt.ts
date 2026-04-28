import { createHmac } from 'crypto';

/**
 * Base64url encode a Buffer (no padding).
 */
export function base64url(data: Buffer): string {
  return data.toString('base64url');
}

/**
 * Encode a payload as an HS256-signed JWT with typ secevent+jwt.
 */
export function jwtEncode(payload: object, secret: string): string {
  const header = { alg: 'HS256', typ: 'secevent+jwt' };
  const headerB64 = base64url(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = createHmac('sha256', secret)
    .update(signingInput)
    .digest();
  return `${signingInput}.${base64url(signature)}`;
}
