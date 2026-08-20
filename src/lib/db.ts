import postgres from 'postgres';

const databaseUrl = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL missing. Set it in your .env file.');
}

declare global {
  // eslint-disable-next-line no-var
  var __sergio_sql__: ReturnType<typeof postgres> | undefined;
}

function createSql() {
  if (!databaseUrl) {
    // Return a stub that throws on use — keeps import-time safe for build without DB
    const stub = (() => {
      throw new Error('DATABASE_URL is not configured');
    }) as unknown as ReturnType<typeof postgres>;
    return stub;
  }

  return postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

export const sql = globalThis.__sergio_sql__ ?? createSql();

if (import.meta.env.DEV) {
  globalThis.__sergio_sql__ = sql;
}

export default sql;
