import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { PostResult } from './types';

/**
 * POST a JWT-encoded SCIM SET event to the configured endpoint.
 */
export async function postEvent(
  jwtToken: string,
  url: string,
  bearerToken: string,
  uri: string
): Promise<PostResult> {
  return new Promise<PostResult>(resolve => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;

    const req = transport.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/secevent+jwt',
          Authorization: `Bearer ${bearerToken}`,
        },
        timeout: 30000,
      },
      res => {
        let body = '';
        res.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        res.on('end', () => {
          const statusCode = res.statusCode ?? 0;
          if (statusCode >= 200 && statusCode < 300) {
            resolve({ success: true, statusCode, uri });
          } else {
            resolve({
              success: false,
              statusCode,
              error: `HTTP ${statusCode}: ${body}`,
              uri,
            });
          }
        });
      }
    );

    req.on('error', (err: Error) => {
      resolve({ success: false, error: err.message, uri });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Request timed out', uri });
    });

    req.write(jwtToken);
    req.end();
  });
}
