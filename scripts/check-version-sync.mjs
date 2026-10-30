#!/usr/bin/env node
/**
 * CI gate: keep the desktop app version and the bundled extension version in sync
 * across every place they are declared. Anchors (no literals here):
 *   app -> package.json#/version; ext -> ai-context-monitor/manifest.json#/version
 * No external dependencies: only node:fs and node:path.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEMVER = String.raw`(\d+\.\d+\.\d+)`; // capture group 1
const SEMVER_EXACT = /^\d+\.\d+\.\d+$/; // anchor validation

const POLYFILL_RE = new RegExp(String.raw`\bversion:\s*['"]${SEMVER}['"]`);
const DOCS_RE = new RegExp(String.raw`docs_footer_version_label[^>]*>[^<]*<\/span>\s*${SEMVER}`);
const README_APP_RE = new RegExp(String.raw`Current version:\*\*\s*${SEMVER}`);
const README_EXT_RE = new RegExp(String.raw`Bundled extension:\*\*\s*${SEMVER}`);
const README_RU_APP_RE = new RegExp(String.raw`Текущая версия:\*\*\s*${SEMVER}`);

function readText(relPath) {
  try {
    return readFileSync(join(ROOT, relPath), 'utf8');
  } catch (error) {
    throw new Error(`cannot read ${relPath}: ${error.message}`);
  }
}

function readJson(relPath) {
  const text = readText(relPath);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${relPath}: invalid JSON (${error.message})`);
  }
}

function capture(relPath, pattern, label) {
  const text = readText(relPath);
  const match = text.match(pattern);
  if (!match) throw new Error(`${relPath}: ${label} not found`);
  return match[1];
}

// --- 1. anchors -----------------------------------------------------------

function resolveAnchors() {
  const pkg = readJson('package.json');
  const manifest = readJson('ai-context-monitor/manifest.json');
  const validate = (relPath, value) => {
    if (typeof value !== 'string' || !SEMVER_EXACT.test(value)) {
      throw new Error(`${relPath}: version ${JSON.stringify(value)} is not plain X.Y.Z`);
    }
    return value;
  };
  return {
    ctx: { pkg, manifest },
    anchors: {
      app: { version: validate('package.json', pkg.version), source: 'package.json' },
      ext: { version: validate('ai-context-monitor/manifest.json', manifest.version),
        source: 'ai-context-monitor/manifest.json' },
    },
  };
}

// --- 2. declarative table of version points ------------------------------

const POINTS = [
  { kind: 'app', source: 'package.json', anchor: true, label: 'package.json version',
    read: (ctx) => ctx.pkg.version },
  { kind: 'app', source: 'package-lock.json', label: 'package-lock.json version',
    read: () => readJson('package-lock.json').version },
  { kind: 'app', source: 'package-lock.json', label: 'package-lock.json packages[""].version',
    read: () => readJson('package-lock.json').packages?.['']?.version },
  { kind: 'ext', source: 'ai-context-monitor/manifest.json', anchor: true,
    label: 'ai-context-monitor/manifest.json version', read: (ctx) => ctx.manifest.version },
  { kind: 'ext', source: 'ai-context-monitor/polyfill.js',
    label: 'ai-context-monitor/polyfill.js version',
    read: () => capture('ai-context-monitor/polyfill.js', POLYFILL_RE, 'version literal') },
  { kind: 'ext', source: 'ai-context-monitor/docs/index.html',
    label: 'ai-context-monitor/docs/index.html footer version',
    read: () => capture('ai-context-monitor/docs/index.html', DOCS_RE, 'footer version') },
  { kind: 'app', source: 'README.md', label: 'README.md Current version',
    read: () => capture('README.md', README_APP_RE, 'Current version') },
  { kind: 'ext', source: 'README.md', label: 'README.md Bundled extension',
    read: () => capture('README.md', README_EXT_RE, 'Bundled extension') },
  { kind: 'app', source: 'README.ru.md', label: 'README.ru.md Текущая версия',
    read: () => capture('README.ru.md', README_RU_APP_RE, 'Текущая версия') },
  { kind: 'ext', source: 'README.ru.md', label: 'README.ru.md Bundled extension',
    read: () => capture('README.ru.md', README_EXT_RE, 'Bundled extension') },
];

// --- 3. collection --------------------------------------------------------

function collect(points, ctx, anchors) {
  return points.map((point) => {
    const { version, source } = anchors[point.kind];
    let actual;
    let error;
    try { actual = point.read(ctx); } catch (err) { error = err.message; }
    return { ...point, actual, error, expected: version, expectedFrom: source };
  });
}

// --- 4. render / exit -----------------------------------------------------

function main() {
  let resolved;
  try {
    resolved = resolveAnchors();
  } catch (error) {
    console.error(`FATAL ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const rank = (row) => (row.anchor ? 0 : 1);
  const rows = collect(POINTS, resolved.ctx, resolved.anchors)
    .sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label));

  let failed = 0;
  for (const row of rows) {
    if (row.anchor) {
      console.log(`ANCHOR ${row.kind.padEnd(3)} ${row.actual}  <- ${row.source}`);
      continue;
    }
    const ok = !row.error && row.actual === row.expected;
    if (!ok) failed += 1;
    const shown = row.error ? `<error: ${row.error}>` : row.actual === undefined ? '<missing>' : row.actual;
    const suffix = ok ? '' : ` (expected ${row.kind} ${row.expected} from ${row.expectedFrom})`;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${row.label}: ${shown}${suffix}`);
  }

  const sources = new Set(rows.map((row) => row.source)).size;
  const comparisons = rows.filter((row) => !row.anchor).length;
  if (failed > 0) {
    console.error(
      `\nVersion sync failed: ${failed} of ${comparisons} comparisons mismatched ` +
        `(app ${resolved.anchors.app.version}, extension ${resolved.anchors.ext.version}).`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(`\nVersion sync OK: app ${resolved.anchors.app.version} (${resolved.anchors.app.source}), ` +
    `extension ${resolved.anchors.ext.version} (${resolved.anchors.ext.source}) — ` +
    `${rows.length} version points (2 anchors, ${comparisons} comparisons) across ${sources} sources.`);
}

main();
