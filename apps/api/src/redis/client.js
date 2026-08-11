import { createClient } from 'redis';
import { config } from '../config.js';

let clientPromise = null;

async function init() {
  if (!config.redisUrl) {
    throw new Error('REDIS_URL is not set - copy it from your Redis Cloud database page.');
  }
  const client = createClient({ url: config.redisUrl });
  client.on('error', (err) => console.error('[redis]', err.message));
  await client.connect();
  return client;
}

/** Shared lazy singleton. All Redis access goes through this. */
export function redis() {
  if (!clientPromise) {
    clientPromise = init().catch((err) => {
      clientPromise = null; // allow retry on next call
      throw err;
    });
  }
  return clientPromise;
}
