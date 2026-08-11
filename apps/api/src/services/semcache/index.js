import crypto from 'node:crypto';
import { embed } from 'ai';
import { google } from '@ai-sdk/google';
import { redis } from '../../redis/client.js';
import { keys } from '../../redis/keys.js';
import { config } from '../../config.js';

/**
 * Semantic cache: stores question -> SQL keyed by *meaning*, not exact text.
 *
 * Every entry is a Redis hash carrying the question's embedding vector plus
 * TAG fields for the user id and schema checksum. Lookups are one FT.SEARCH
 * KNN call with the tag filter applied inside the query, so:
 *   - one user can never be served another user's cached SQL, and
 *   - a schema change (new checksum) invalidates the cache automatically.
 *
 * An exact-match layer (hash of the normalized question) runs first and
 * skips even the embedding call for repeat questions.
 *
 * Degrades gracefully: if the Redis deployment lacks the query engine
 * (FT.* commands), only the exact-match layer is used.
 */

let indexReady = false;
let vectorSearchAvailable = true;

export function normalizeQuestion(question) {
  return question.toLowerCase().replace(/\s+/g, ' ').trim();
}

function questionHash(normalized) {
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32);
}

function embeddingToBuffer(embedding) {
  return Buffer.from(new Float32Array(embedding).buffer);
}

async function embedQuestion(normalized) {
  const { embedding } = await embed({
    model: google.textEmbedding(config.semcache.embeddingModel),
    value: normalized,
    providerOptions: {
      google: { outputDimensionality: config.semcache.embeddingDim, taskType: 'SEMANTIC_SIMILARITY' },
    },
  });
  return embedding;
}

async function ensureIndex(client) {
  if (indexReady || !vectorSearchAvailable) return;
  try {
    await client.sendCommand([
      'FT.CREATE', keys.SEMCACHE_INDEX,
      'ON', 'HASH',
      'PREFIX', '1', keys.SEMCACHE_PREFIX,
      'SCHEMA',
      'user_id', 'TAG',
      'schema_checksum', 'TAG',
      'embedding', 'VECTOR', 'HNSW', '6',
      'TYPE', 'FLOAT32',
      'DIM', String(config.semcache.embeddingDim),
      'DISTANCE_METRIC', 'COSINE',
    ]);
    indexReady = true;
  } catch (err) {
    if (/index already exists/i.test(err.message)) {
      indexReady = true;
    } else if (/unknown command/i.test(err.message)) {
      vectorSearchAvailable = false;
      console.warn('[semcache] FT.* commands unavailable - semantic matching disabled, exact cache only.');
    } else {
      throw err;
    }
  }
}

/**
 * Returns { sql, question, similarity, exact } on a hit, or null.
 * Never throws: a cache failure must not break the ask flow.
 */
export async function lookup({ userId, schemaChecksum, question }) {
  try {
    const client = await redis();
    const normalized = normalizeQuestion(question);
    const exactKey = keys.semEntry(userId, schemaChecksum, questionHash(normalized));

    const exact = await client.hGetAll(exactKey);
    if (exact?.sql) {
      return { sql: exact.sql, question: exact.question, similarity: 1, exact: true };
    }

    await ensureIndex(client);
    if (!vectorSearchAvailable) return null;

    const vector = embeddingToBuffer(await embedQuestion(normalized));
    const reply = await client.sendCommand([
      'FT.SEARCH', keys.SEMCACHE_INDEX,
      `(@user_id:{${userId}} @schema_checksum:{${schemaChecksum}})=>[KNN 1 @embedding $vec AS dist]`,
      'PARAMS', '2', 'vec', vector,
      'SORTBY', 'dist', 'ASC',
      'RETURN', '3', 'sql', 'question', 'dist',
      'DIALECT', '2',
    ]);

    // RESP2 reply shape: [total, key, [field, value, field, value, ...]]
    if (!Array.isArray(reply) || Number(reply[0]) < 1) return null;
    const fields = reply[2];
    const doc = {};
    for (let i = 0; i < fields.length; i += 2) {
      doc[String(fields[i])] = String(fields[i + 1]);
    }
    const distance = Number.parseFloat(doc.dist);
    if (!Number.isFinite(distance) || distance > config.semcache.maxDistance) return null;

    return {
      sql: doc.sql,
      question: doc.question,
      similarity: Number((1 - distance).toFixed(4)),
      exact: false,
    };
  } catch (err) {
    console.warn('[semcache] lookup failed:', err.message);
    return null;
  }
}

/** Stores a successful question -> SQL pair. Never throws. */
export async function store({ userId, schemaChecksum, question, sql }) {
  try {
    const client = await redis();
    const normalized = normalizeQuestion(question);
    const key = keys.semEntry(userId, schemaChecksum, questionHash(normalized));

    const entry = {
      user_id: String(userId),
      schema_checksum: schemaChecksum,
      question: question.trim(),
      sql,
    };
    if (vectorSearchAvailable) {
      await ensureIndex(client);
      if (vectorSearchAvailable) {
        entry.embedding = embeddingToBuffer(await embedQuestion(normalized));
      }
    }

    await client.hSet(key, entry);
    await client.expire(key, config.semcache.ttlSeconds);
  } catch (err) {
    console.warn('[semcache] store failed:', err.message);
  }
}
