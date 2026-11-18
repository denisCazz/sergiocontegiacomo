import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const blogCardSource = readFileSync(new URL('../src/components/BlogCard.astro', import.meta.url), 'utf8');
const cmsSource = readFileSync(new URL('../src/lib/cms.ts', import.meta.url), 'utf8');

test('BlogCard coerces rating and commentCount to finite numbers before formatting', () => {
  assert.match(blogCardSource, /Number\(rating\)/);
  assert.match(blogCardSource, /Number\.isFinite\(numericRating\)/);
  assert.match(blogCardSource, /numericRating\.toFixed\(1\)/);
  assert.doesNotMatch(blogCardSource, /\{rating\.toFixed\(1\)\}/);
});

test('cms normalizes numeric stats returned as strings by postgres', () => {
  assert.match(cmsSource, /function normalizeArticleStats/);
  assert.match(cmsSource, /comment_count:\s*Number\.isFinite\(commentCount\)/);
  assert.match(cmsSource, /average_rating:\s*Number\.isFinite\(averageRating\)/);
});
