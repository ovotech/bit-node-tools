import { verify } from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

export interface BouncerConfig {
  issuer: string;
  jwksUri: string;
}

export const decodeAccessToken = (accessToken: string, config: BouncerConfig) => {
  const client = jwksClient({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: config.jwksUri,
  });

  const getSigningKey = (header: any, callback: any) => {
    client.getSigningKey(header.kid).then(
      key => {
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
      },
      err => callback(err),
    );
  };

  return new Promise((resolve, reject) => {
    verify(
      accessToken,
      getSigningKey,
      {
        issuer: config.issuer,
      },
      (error, verifiedToken) => {
        if (error) {
          reject(error);
        } else {
          resolve(verifiedToken);
        }
      },
    );
  });
};
