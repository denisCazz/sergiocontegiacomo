import postgres from 'postgres';
import { createDbCooldown, databaseUnavailableError, DB_CONNECT_TIMEOUT_SEC } from './dbGuard';

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

  const cooldown = createDbCooldown();
  const client = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: DB_CONNECT_TIMEOUT_SEC,
  });

  const settle = (result: unknown) => {
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      return (result as Promise<unknown>).then(
        (value) => {
          cooldown.clear();
          return value;
        },
        (error: unknown) => {
          cooldown.note(error);
          throw error;
        },
      );
    }
    return result;
  };

  return new Proxy(client, {
    apply(target, thisArg, argArray) {
      if (cooldown.isCoolingDown()) return Promise.reject(databaseUnavailableError());
      return settle(Reflect.apply(target, thisArg, argArray));
    },
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) => {
        if (cooldown.isCoolingDown()) return Promise.reject(databaseUnavailableError());
        return settle(value.apply(target, args));
      };
    },
  });
}

export const sql = globalThis.__sergio_sql__ ?? createSql();

if (import.meta.env.DEV) {
  globalThis.__sergio_sql__ = sql;
}

export default sql;
