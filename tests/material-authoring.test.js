'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createMaterialEntry } = require('../tools/new-material-entry');
const { loadManifest, validateManifest } = require('../tools/material-library');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'material-authoring-'));
const manifestPath = path.join(tempRoot, 'content', 'manifest.json');

fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(
  manifestPath,
  `${JSON.stringify({ manifest_version: 'content-manifest-v1', items: [] }, null, 2)}\n`,
  'utf8'
);

try {
  {
    const preview = createMaterialEntry({
      manifestPath,
      id: 'limits-practice-note',
      topic: 'limits',
      type: 'note',
      title: 'Limits Practice Note',
      description: 'A quick conceptual prompt before symbolic limit practice.',
      body: 'Ask students what value the graph approaches from both sides.',
      addedDate: '2026-04-19',
      tags: 'limits,concept',
      dryRun: true
    });

    assert.equal(preview.dry_run, true);
    assert.equal(preview.entry.id, 'limits-practice-note');
    assert.equal(preview.entry.body.includes('graph approaches'), true);
    assert.equal(loadManifest(manifestPath).items.length, 0, 'dry-run should not modify the manifest file');
  }

  {
    const created = createMaterialEntry({
      manifestPath,
      id: 'shared-calc-reference',
      topic: 'shared',
      type: 'link',
      title: 'Shared Calculus Reference',
      description: 'External reference that supports review across multiple weeks.',
      url: 'https://example.com/calculus-reference',
      addedDate: '2026-04-19',
      tags: ['reference', 'shared'],
      author: 'Codex test'
    });

    assert.equal(created.dry_run, false);
    const manifest = loadManifest(manifestPath);
    assert.equal(manifest.items.length, 1);
    assert.equal(manifest.items[0].id, 'shared-calc-reference');
    assert.equal(
      validateManifest(manifest, manifestPath).filter((issue) => issue.severity === 'error').length,
      0,
      'written manifest should validate cleanly'
    );
  }

  {
    assert.throws(
      () =>
        createMaterialEntry({
          manifestPath,
          id: 'shared-calc-reference',
          topic: 'shared',
          type: 'link',
          title: 'Duplicate Shared Calculus Reference',
          description: 'Duplicate id should be blocked unless force is used.',
          url: 'https://example.com/duplicate',
          addedDate: '2026-04-19'
        }),
      /already contains id "shared-calc-reference"/
    );
  }

  {
    createMaterialEntry({
      manifestPath,
      id: 'shared-calc-reference',
      topic: 'shared',
      type: 'note',
      title: 'Shared Calculus Reference',
      description: 'Replacement note for the same id after intentional overwrite.',
      body: 'Use this note when no external link is needed.',
      addedDate: '2026-04-19',
      force: true
    });

    const manifest = loadManifest(manifestPath);
    assert.equal(manifest.items.length, 1);
    assert.equal(manifest.items[0].type, 'note');
    assert.equal(manifest.items[0].body, 'Use this note when no external link is needed.');
  }
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('material authoring tests passed');
