import { query } from '../pool.js';

export async function createUser({ email, name, passwordHash = null, googleSub = null }) {
  const { rows } = await query(
    `INSERT INTO users (email, name, password_hash, google_sub)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, created_at`,
    [email.toLowerCase(), name, passwordHash, googleSub]
  );
  return rows[0];
}

export async function getUserByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return rows[0] ?? null;
}

export async function getUserByGoogleSub(googleSub) {
  const { rows } = await query('SELECT * FROM users WHERE google_sub = $1', [googleSub]);
  return rows[0] ?? null;
}

export async function getUserById(id) {
  const { rows } = await query('SELECT id, email, name, created_at FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function linkGoogleSub(userId, googleSub) {
  const { rows } = await query(
    `UPDATE users SET google_sub = $2 WHERE id = $1
     RETURNING id, email, name, created_at`,
    [userId, googleSub]
  );
  return rows[0];
}

/**
 * Find by Google subject, else link/create by verified email.
 * Returns { user, created }.
 */
export async function upsertGoogleUser({ googleSub, email, name }) {
  const bySub = await getUserByGoogleSub(googleSub);
  if (bySub) {
    return { user: { id: bySub.id, email: bySub.email, name: bySub.name }, created: false };
  }

  const byEmail = await getUserByEmail(email);
  if (byEmail) {
    // Same verified email already registered with password — link Google to it.
    const linked = await linkGoogleSub(byEmail.id, googleSub);
    return { user: linked, created: false };
  }

  const user = await createUser({ email, name, passwordHash: null, googleSub });
  return { user, created: true };
}

export async function countUsers() {
  const { rows } = await query('SELECT count(*)::int AS n FROM users');
  return rows[0].n;
}

/** First registered user adopts any data sources created before auth existed. */
export async function claimOrphanDataSources(userId) {
  const { rowCount } = await query(
    'UPDATE data_sources SET user_id = $1 WHERE user_id IS NULL',
    [userId]
  );
  return rowCount;
}
