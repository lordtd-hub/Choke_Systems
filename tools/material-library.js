'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Ajv2020 = require('ajv/dist/2020');

const DEFAULT_MANIFEST_PATH = path.join(__dirname, '..', 'SBRA+interactive material', 'content', 'manifest.json');
const MATERIAL_TOPICS = ['limits', 'continuity', 'differentiation', 'integration', 'shared'];
const MATERIAL_TYPES = ['pdf', 'md', 'html', 'image', 'video', 'link', 'note'];

const CLUSTER_TOPIC_MAP = {
  UNIT1: ['limits', 'continuity'],
  UNIT2: ['differentiation'],
  UNIT3: ['differentiation'],
  UNIT4: ['integration']
};

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildManifestValidator() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false
  });
  const schema = readJsonFile(path.join(__dirname, '..', 'schemas', 'content_manifest.schema.json'));
  return ajv.compile(schema);
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || '/'} ${error.message}`);
}

function inferMaterialTopicsForWeek(weeklyUnit) {
  const topics = new Set(['shared']);
  (CLUSTER_TOPIC_MAP[weeklyUnit.content_cluster_id] || []).forEach((topic) => topics.add(topic));

  const titleAndTopics = `${weeklyUnit.title}\n${(weeklyUnit.topics || []).join('\n')}`.toLowerCase();
  if (titleAndTopics.includes('limit') || titleAndTopics.includes('ลิมิต')) {
    topics.add('limits');
  }
  if (titleAndTopics.includes('continuity') || titleAndTopics.includes('ต่อเนื่อง')) {
    topics.add('continuity');
  }
  if (
    titleAndTopics.includes('derivative') ||
    titleAndTopics.includes('differenti') ||
    titleAndTopics.includes('อนุพันธ์')
  ) {
    topics.add('differentiation');
  }
  if (
    titleAndTopics.includes('integral') ||
    titleAndTopics.includes('integration') ||
    titleAndTopics.includes('ปริพันธ์')
  ) {
    topics.add('integration');
  }

  return [...topics];
}

function validateManifest(manifest, manifestPath = DEFAULT_MANIFEST_PATH) {
  const validate = buildManifestValidator();
  const issues = [];
  if (!validate(manifest)) {
    formatAjvErrors(validate.errors).forEach((message) => {
      issues.push({ severity: 'error', message: `manifest schema: ${message}` });
    });
  }

  const ids = (manifest.items || []).map((item) => item.id);
  ids.forEach((id, index) => {
    if (ids.indexOf(id) !== index) {
      issues.push({ severity: 'error', message: `manifest contains duplicate id "${id}".` });
    }
  });

  (manifest.items || []).forEach((item) => {
    if (item.path) {
      const resolved = path.join(path.dirname(manifestPath), item.path);
      if (!fs.existsSync(resolved)) {
        issues.push({
          severity: 'warning',
          message: `manifest item "${item.id}" points to missing path "${item.path}".`
        });
      }
    }
  });

  return issues;
}

function resolveWeeklyMaterials(weeklyUnit, manifest) {
  const materialTopics = new Set(inferMaterialTopicsForWeek(weeklyUnit));
  return (manifest.items || []).filter((item) => materialTopics.has(item.topic));
}

function loadManifest(manifestPath = DEFAULT_MANIFEST_PATH) {
  return readJsonFile(manifestPath);
}

if (require.main === module) {
  const manifestPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : DEFAULT_MANIFEST_PATH;
  const manifest = loadManifest(manifestPath);
  const issues = validateManifest(manifest, manifestPath);

  issues.filter((issue) => issue.severity === 'error').forEach((issue) => console.error(`ERROR: ${issue.message}`));
  issues.filter((issue) => issue.severity === 'warning').forEach((issue) => console.warn(`WARN: ${issue.message}`));

  if (issues.filter((issue) => issue.severity === 'error').length === 0) {
    console.log(`Material manifest validated with ${issues.filter((issue) => issue.severity === 'warning').length} warning(s).`);
  } else {
    process.exit(1);
  }
}

module.exports = {
  CLUSTER_TOPIC_MAP,
  DEFAULT_MANIFEST_PATH,
  MATERIAL_TOPICS,
  MATERIAL_TYPES,
  inferMaterialTopicsForWeek,
  loadManifest,
  resolveWeeklyMaterials,
  validateManifest
};
