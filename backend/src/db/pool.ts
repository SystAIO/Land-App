import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

import config from '../config';

const sslConfig = config.databaseCa
  ? { rejectUnauthorized: true, ca: config.databaseCa }
  : ({ rejectUnauthorized: false } as const);

if (config.isProd && !config.databaseCa) {
  console.warn(
    'WARNING: DATABASE_CA is not set — database SSL does not verify the server certificate.'
  );
}

export const pool: Pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: sslConfig,
});

export async function query<Row extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<Row>> {
  return pool.query<Row>(text, params);
}

/** Runs `fn(client)` inside a transaction (BEGIN/COMMIT/ROLLBACK). */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
