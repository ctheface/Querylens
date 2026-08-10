import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/errors.js';
import { encryptSecret } from '../lib/crypto.js';
import { buildClientConfig } from '../services/connector/clientConfig.js';
import { testConnection } from '../services/connector/testConnection.js';
import { introspectAndStore } from '../services/introspectAndStore.js';
import {
  listDataSources,
  getDataSourceWithSecrets,
  insertDataSource,
  deleteDataSource,
} from '../db/repos/dataSources.js';
import { latestSnapshot } from '../db/repos/snapshots.js';

const router = Router();

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  host: z.string().trim().min(1),
  port: z.coerce.number().int().min(1).max(65535).default(5432),
  database: z.string().trim().min(1),
  username: z.string().trim().min(1),
  password: z.string().min(1),
  sslMode: z.enum(['require', 'disable']).default('require'),
});

async function loadDataSource(id) {
  const numericId = Number.parseInt(id, 10);
  if (!Number.isInteger(numericId)) {
    throw new ApiError(400, 'E_VALIDATION', 'Invalid data source id');
  }
  const ds = await getDataSourceWithSecrets(numericId);
  if (!ds) {
    throw new ApiError(404, 'E_NOT_FOUND', 'Data source not found');
  }
  return ds;
}

router.get('/', async (req, res) => {
  res.json(await listDataSources());
});

router.post('/', async (req, res) => {
  const input = createSchema.parse(req.body);

  // Verify the connection before storing anything.
  const probeConfig = buildClientConfig(
    {
      host: input.host,
      port: input.port,
      database_name: input.database,
      username: input.username,
      ssl_mode: input.sslMode,
    },
    input.password
  );
  try {
    await testConnection(probeConfig);
  } catch (err) {
    throw new ApiError(400, 'E_CONNECTION', `Could not connect: ${err.message}`);
  }

  const encrypted = encryptSecret(input.password);
  const created = await insertDataSource({
    name: input.name,
    host: input.host,
    port: input.port,
    database: input.database,
    username: input.username,
    passwordCiphertext: encrypted.ciphertext,
    passwordIv: encrypted.iv,
    passwordAuthTag: encrypted.authTag,
    sslMode: input.sslMode,
  });

  // Best-effort initial introspection so the source is queryable immediately.
  let introspected = false;
  try {
    const ds = await getDataSourceWithSecrets(created.id);
    await introspectAndStore(ds);
    introspected = true;
  } catch (err) {
    console.warn(`initial introspection failed for source ${created.id}:`, err.message);
  }

  res.status(201).json({ ...created, introspected });
});

router.post('/:id/introspect', async (req, res) => {
  const ds = await loadDataSource(req.params.id);
  try {
    const snapshot = await introspectAndStore(ds);
    res.json({
      dataSourceId: ds.id,
      checksum: snapshot.checksum,
      tableCount: snapshot.tables.length,
      capturedAt: snapshot.captured_at,
    });
  } catch (err) {
    throw new ApiError(400, 'E_INTROSPECT', `Introspection failed: ${err.message}`);
  }
});

router.get('/:id/schema', async (req, res) => {
  const ds = await loadDataSource(req.params.id);
  const snapshot = await latestSnapshot(ds.id);
  if (!snapshot) {
    throw new ApiError(404, 'E_NO_SNAPSHOT', 'No schema snapshot yet - run introspection first.');
  }
  res.json({
    dataSourceId: ds.id,
    name: ds.name,
    tables: snapshot.tables,
    checksum: snapshot.checksum,
    capturedAt: snapshot.captured_at,
  });
});

router.delete('/:id', async (req, res) => {
  const ds = await loadDataSource(req.params.id);
  await deleteDataSource(ds.id);
  res.status(204).end();
});

export default router;
