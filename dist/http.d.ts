import { PostResult } from './types';
/**
 * POST a JWT-encoded SCIM SET event to the configured endpoint.
 */
export declare function postEvent(jwtToken: string, url: string, bearerToken: string, uri: string): Promise<PostResult>;
