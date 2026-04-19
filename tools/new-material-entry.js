'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  DEFAULT_MANIFEST_PATH,
  MATERIAL_TOPICS,
  MATERIAL_TYPES,
  loadManifest,
  validateManifest
} = require('./material-library');

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeString(value, fieldName) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  return normalized;
}

function normalizeTags(tags) {
  if (!tags) {
    return [];
  }

  const values = Array.isArray(tags) ? tags : String(tags).split(',');
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function normalizeManifest(manifest) {
  return {
    manifest_version: manifest.manifest_version || 'content-manifest-v1',
    items: Array.isArray(manifest.items) ? manifest.items.slice() : []
  };
}

function compareItems(left, right) {
  const topicComparison = left.topic.localeCompare(right.topic, undefined, { sensitivity: 'base' });
  if (topicComparison !== 0) {
    return topicComparison;
  }
  return left.id.localeCompare(right.id, undefined, { numeric: true, sensitivity: 'base' });
}

function buildMaterialEntry({
  id,
  topic,
  title,
  description,
  type,
  path: entryPath,
  url,
  body,
  addedDate = todayIsoDate(),
  tags,
  author,
  duration
}) {
  const normalizedId = normalizeString(id, 'id');
  const normalizedTopic = normalizeString(topic, 'topic');
  const normalizedTitle = normalizeString(title, 'title');
  const normalizedDescription = normalizeString(description, 'description');
  const normalizedType = normalizeString(type, 'type');
  const normalizedDate = normalizeString(addedDate, 'addedDate');
  const normalizedTags = normalizeTags(tags);

  if (!ID_PATTERN.test(normalizedId)) {
    throw new Error('id must be kebab-case using lowercase letters, digits, and hyphens only.');
  }
  if (!MATERIAL_TOPICS.includes(normalizedTopic)) {
    throw new Error(`topic must be one of: ${MATERIAL_TOPICS.join(', ')}.`);
  }
  if (!MATERIAL_TYPES.includes(normalizedType)) {
    throw new Error(`type must be one of: ${MATERIAL_TYPES.join(', ')}.`);
  }
  if (normalizedDescription.length > 160) {
    throw new Error('description must be 160 characters or fewer.');
  }
  if (!DATE_PATTERN.test(normalizedDate)) {
    throw new Error('addedDate must use YYYY-MM-DD format.');
  }

  const normalizedPath = entryPath ? normalizeString(entryPath, 'path') : undefined;
  const normalizedUrl = url ? normalizeString(url, 'url') : undefined;
  const normalizedBody = body ? normalizeString(body, 'body') : undefined;

  if (normalizedPath && normalizedUrl) {
    throw new Error('provide either path or url, not both.');
  }

  if (normalizedType === 'note') {
    if (!normalizedBody) {
      throw new Error('note entries require body.');
    }
    if (normalizedPath || normalizedUrl) {
      throw new Error('note entries must not include path or url.');
    }
  } else if (!normalizedPath && !normalizedUrl) {
    throw new Error(`type "${normalizedType}" requires either path or url.`);
  }

  if (normalizedUrl && !/^https?:\/\//.test(normalizedUrl)) {
    throw new Error('url must start with http:// or https://.');
  }

  return Object.fromEntries(
    Object.entries({
      id: normalizedId,
      topic: normalizedTopic,
      title: normalizedTitle,
      description: normalizedDescription,
      type: normalizedType,
      path: normalizedPath,
      url: normalizedUrl,
      body: normalizedBody,
      addedDate: normalizedDate,
      tags: normalizedTags.length > 0 ? normalizedTags : undefined,
      author: author ? normalizeString(author, 'author') : undefined,
      duration: duration ? normalizeString(duration, 'duration') : undefined
    }).filter(([, value]) => value !== undefined)
  );
}

function upsertManifestEntry(manifest, entry, { force = false } = {}) {
  const nextManifest = normalizeManifest(manifest);
  const existing = nextManifest.items.find((item) => item.id === entry.id);

  if (existing && !force) {
    throw new Error(`manifest already contains id "${entry.id}". Use --force to replace it.`);
  }

  nextManifest.items = nextManifest.items.filter((item) => item.id !== entry.id);
  nextManifest.items.push(entry);
  nextManifest.items.sort(compareItems);
  return nextManifest;
}

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function createMaterialEntry({
  manifestPath = DEFAULT_MANIFEST_PATH,
  force = false,
  dryRun = false,
  ...entryOptions
}) {
  const manifest = fs.existsSync(manifestPath)
    ? loadManifest(manifestPath)
    : { manifest_version: 'content-manifest-v1', items: [] };
  const entry = buildMaterialEntry(entryOptions);
  const nextManifest = upsertManifestEntry(manifest, entry, { force });

  if (!dryRun) {
    ensureParentDirectory(manifestPath);
    fs.writeFileSync(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, 'utf8');

    const issues = validateManifest(nextManifest, manifestPath);
    const errors = issues.filter((issue) => issue.severity === 'error');
    if (errors.length > 0) {
      throw new Error(`manifest validation failed: ${errors.map((issue) => issue.message).join(' | ')}`);
    }
  }

  return {
    id: entry.id,
    manifest_path: manifestPath,
    dry_run: dryRun,
    entry,
    manifest_preview: nextManifest
  };
}

function parseCliArgs(argv) {
  const options = {
    dryRun: false,
    force: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (!argument.startsWith('--')) {
      throw new Error(`unexpected argument "${argument}". Use named flags only.`);
    }

    if (argument === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (argument === '--force') {
      options.force = true;
      continue;
    }

    const [rawKey, inlineValue] = argument.split('=');
    const key = rawKey.slice(2);
    const value = inlineValue !== undefined ? inlineValue : argv[index + 1];
    if (inlineValue === undefined) {
      index += 1;
    }

    if (value === undefined || value.startsWith('--')) {
      throw new Error(`flag "${rawKey}" requires a value.`);
    }

    options[key] = value;
  }

  return options;
}

if (require.main === module) {
  let options;
  try {
    options = parseCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(
      'Usage: node tools/new-material-entry.js --id <id> --topic <topic> --type <type> --title <title> --description <description> [--path <path> | --url <url> | --body <body>] [--addedDate <YYYY-MM-DD>] [--tags <tag1,tag2>] [--author <name>] [--duration <text>] [--manifestPath <path>] [--dry-run] [--force]'
    );
    process.exit(1);
  }

  const result = createMaterialEntry({
    manifestPath: options.manifestPath ? path.resolve(process.cwd(), options.manifestPath) : DEFAULT_MANIFEST_PATH,
    id: options.id,
    topic: options.topic,
    type: options.type,
    title: options.title,
    description: options.description,
    path: options.path,
    url: options.url,
    body: options.body,
    addedDate: options.addedDate,
    tags: options.tags,
    author: options.author,
    duration: options.duration,
    dryRun: options.dryRun,
    force: options.force
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

module.exports = {
  buildMaterialEntry,
  createMaterialEntry,
  normalizeTags,
  parseCliArgs,
  upsertManifestEntry
};
