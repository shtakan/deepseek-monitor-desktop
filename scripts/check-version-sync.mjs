#!/usr/bin/env node
/**
 * CI gate: keep the desktop app version and the bundled extension version
 * in sync across every place they are declared.
 *
 * Sources of truth for this check:
 *   app version 1.1.0  - package.json / package-lock.json / README*.md
 *   ext version 2.0.32 - ai-context-monitor/manifest.json / polyfill.js /
 *                        docs/index.html / README*.md
 *
 * No external dependencies: only node:fs and node:path.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const EXPECTED = {
  app: '1.1.0',
  ext: '2.0.32',
};

const SEMVER = String.raw`(\d+\.\d+\.\d+)`;

function readText(relPath) {
  try {
    return readFileSync(join(ROOT, relPath), 'utf8');
  } catch (error) {
    throw new Error(`cannot read ${relPath}: ${error.message}`);
  }
}

function capture(relPath, pattern, label) {
  const text = readText(relPath);
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`${relPath}: ${label} not found`);
  }
  return match[1];
}

function readJson(relPath) {
  const text = readText(relPath);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${relPath}: invalid JSON (${error.message})`);
  }
}

const checks = [];

function checkApp(label, actual) {
  checks.push({ label, actual, expected: EXPECTED.app, kind: 'app' });
}

function checkExt(label, actual) {
  checks.push({ label, actual, expected: EXPECTED.ext, kind: 'ext' });
}

const pkg = readJson('package.json');
checkApp('package.json version', pkg.version);

const lock = readJson('package-lock.json');
checkApp('package-lock.json version', lock.version);
checkApp(
  'package-lock.json packages[""].version',
  lock.packages && lock.packages[''] ? lock.packages[''].version : undefined,
);

const manifest = readJson('ai-context-monitor/manifest.json');
checkExt('ai-context-monitor/manifest.json version', manifest.version);

checkExt(
  'ai-context-monitor/polyfill.js version',
  capture('ai-context-monitor/polyfill.js', new RegExp(`\\bversion:\\s*'${SEMVER}'`), 'version literal'),
);

checkExt(
  'ai-context-monitor/docs/index.html footer version',
  capture(
    'ai-context-monitor/docs/index.html',
    new RegExp(`docs_footer_version_label[^>]*>[^<]*<\\/span>\\s*${SEMVER}`),
    'footer version',
  ),
);

checkApp(
  'README.md Current version',
  capture('README.md', new RegExp(`Current version:\\*\\*\\s*${SEMVER}`), 'Current version'),
);
checkExt(
  'README.md Bundled extension',
  capture('README.md', new RegExp(`Bundled extension:\\*\\*\\s*${SEMVER}`), 'Bundled extension'),
);

checkApp(
  'README.ru.md Текущая версия',
  capture('README.ru.md', new RegExp(`Текущая версия:\\*\\*\\s*${SEMVER}`), 'Текущая версия'),
);
checkExt(
  'README.ru.md Bundled extension',
  capture('README.ru.md', new RegExp(`Bundled extension:\\*\\*\\s*${SEMVER}`), 'Bundled extension'),
);

let failed = 0;
const sorted = checks.sort((a, b) => a.label.localeCompare(b.label));

for (const { label, actual, expected, kind } of sorted) {
  const ok = actual === expected;
  if (!ok) {
    failed += 1;
  }
  console.log(
    `${ok ? 'OK  ' : 'FAIL'} ${label}: ${actual === undefined ? '<missing>' : actual}` +
      (ok ? '' : ` (expected ${kind} version ${expected})`),
  );
}

if (failed > 0) {
  console.error(
    `\nVersion sync failed: ${failed} of ${checks.length} checks mismatched ` +
      `(app ${EXPECTED.app}, extension ${EXPECTED.ext}).`,
  );
  process.exit(1);
}

console.log(
  `\nVersion sync OK: app ${EXPECTED.app}, extension ${EXPECTED.ext} ` +
    `(${checks.length} checks across 7 version sources).`,
);
