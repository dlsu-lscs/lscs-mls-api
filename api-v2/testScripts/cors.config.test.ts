import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ALLOWED_ORIGINS, parseAllowedOrigins } from '../src/config/cors.js';

describe('parseAllowedOrigins', () => {
  it('falls back to the local web app origin when CORS_ORIGINS is unset or blank', () => {
    assert.deepEqual(DEFAULT_ALLOWED_ORIGINS, ['http://localhost:3001']);
    assert.deepEqual(parseAllowedOrigins(undefined), ['http://localhost:3001']);
    assert.deepEqual(parseAllowedOrigins(''), ['http://localhost:3001']);
    assert.deepEqual(parseAllowedOrigins('  ,  '), ['http://localhost:3001']);
  });

  it('accepts a single origin', () => {
    assert.deepEqual(parseAllowedOrigins('https://app.example.com'), ['https://app.example.com']);
  });

  it('splits a comma-separated list and ignores spaces and empty entries', () => {
    assert.deepEqual(parseAllowedOrigins(' https://app.example.com , http://localhost:3001, '), [
      'https://app.example.com',
      'http://localhost:3001',
    ]);
  });

  it('normalizes entries to the exact form browsers send in the Origin header', () => {
    assert.deepEqual(parseAllowedOrigins('https://App.Example.com/,https://app.example.com:443'), [
      'https://app.example.com',
    ]);
  });

  it('removes duplicates and keeps the first occurrence order', () => {
    assert.deepEqual(
      parseAllowedOrigins('http://localhost:3001,https://app.example.com,http://localhost:3001'),
      ['http://localhost:3001', 'https://app.example.com'],
    );
  });

  const rejected: Array<[string, string, RegExp]> = [
    ['a wildcard', '*', /explicit/i],
    ['a missing scheme', 'app.example.com', /app\.example\.com/],
    ['a non-HTTP scheme', 'ftp://app.example.com', /ftp:\/\/app\.example\.com/],
    ['a path', 'https://app.example.com/login', /\/login/],
    ['a query string', 'https://app.example.com?x=1', /x=1/],
    ['credentials', 'https://user:pw@app.example.com', /app\.example\.com/],
  ];
  for (const [label, value, message] of rejected) {
    it(`rejects ${label} and names the bad entry`, () => {
      assert.throws(() => parseAllowedOrigins(value), message);
    });
  }

  it('mentions CORS_ORIGINS in the error so the setting is easy to find', () => {
    assert.throws(() => parseAllowedOrigins('not a url'), /CORS_ORIGINS/);
  });
});
