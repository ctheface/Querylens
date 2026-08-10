import { decryptSecret } from '../lib/crypto.js';
import { buildClientConfig } from './connector/clientConfig.js';
import { introspectSchema } from './connector/introspect.js';
import { insertSnapshot } from '../db/repos/snapshots.js';
import { touchIntrospected } from '../db/repos/dataSources.js';

/** Connects to the data source, reads its schema, and stores a snapshot. */
export async function introspectAndStore(dataSource) {
  const password = decryptSecret({
    ciphertext: dataSource.password_ciphertext,
    iv: dataSource.password_iv,
    authTag: dataSource.password_auth_tag,
  });
  const clientConfig = buildClientConfig(dataSource, password);
  const { tables, checksum } = await introspectSchema(clientConfig);
  const snapshot = await insertSnapshot(dataSource.id, tables, checksum);
  await touchIntrospected(dataSource.id);
  return snapshot;
}

/** Builds a ready-to-connect pg client config for a stored data source. */
export function connectionConfigFor(dataSource) {
  const password = decryptSecret({
    ciphertext: dataSource.password_ciphertext,
    iv: dataSource.password_iv,
    authTag: dataSource.password_auth_tag,
  });
  return buildClientConfig(dataSource, password);
}
