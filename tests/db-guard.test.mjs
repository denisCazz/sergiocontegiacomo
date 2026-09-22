import assert from 'node:assert/strict';
import test from 'node:test';
import { createDbCooldown, isDatabaseConnectivityError } from '../src/lib/dbGuard.ts';

test('connectivity errors open a cooldown and other errors do not', () => {
  const cooldown = createDbCooldown(1_000);
  const now = 1_000_000;

  assert.equal(cooldown.note(Object.assign(new Error('syntax'), { code: '42601' }), now), false);
  assert.equal(cooldown.isCoolingDown(now + 10), false);

  assert.equal(cooldown.note(Object.assign(new Error('down'), { code: 'CONNECT_TIMEOUT' }), now), true);
  assert.equal(cooldown.isCoolingDown(now + 999), true);
  assert.equal(cooldown.isCoolingDown(now + 1_000), false);
});

test('recognises refused and missing-host connections', () => {
  assert.equal(isDatabaseConnectivityError(Object.assign(new Error('nope'), { code: 'ECONNREFUSED' })), true);
  assert.equal(isDatabaseConnectivityError(new Error('getaddrinfo ENOTFOUND db.example')), true);
  assert.equal(isDatabaseConnectivityError(new Error('relation "articles" does not exist')), false);
});
