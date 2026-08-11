import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { config } from '../../config.js';

function secret() {
  return new TextEncoder().encode(config.auth.jwtSecret);
}

/** Short-lived access token. Held in memory by the client, never in a cookie. */
export async function signAccessToken(user) {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(config.auth.accessTokenTtl)
    .sign(secret());
}

/** Throws when the token is invalid or expired. */
export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
  return payload;
}
