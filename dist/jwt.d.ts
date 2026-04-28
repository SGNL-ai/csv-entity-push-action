/**
 * Base64url encode a Buffer (no padding).
 */
export declare function base64url(data: Buffer): string;
/**
 * Encode a payload as an HS256-signed JWT with typ secevent+jwt.
 */
export declare function jwtEncode(payload: object, secret: string): string;
