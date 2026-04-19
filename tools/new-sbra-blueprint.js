'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const {
  DEFAULT_BLUEPRINT_DIR,
  DEFAULT_REGISTRY_PATH,
  loadRegistry,
  validateRegistryAndBlueprints
} = require('./sbra-blueprints');

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function inferFilename(activityId, slugHint) {
  return `${slugify(activityId)}-${slugify(slugHint || 'sbra-problem')}.yaml`;
}

function buildPlaceholderStep(stepNo, focusLabel) {
  const base = `step${stepNo}`;
  return {
    step_no: stepNo,
    goal: `Confirm the key reasoning move for ${focusLabel}.`,
    prompt: `Choose the best next step for ${focusLabel}.`,
    options: [
      {
        option_id: `${base}_correct`,
        value: `TODO: Write the correct reasoning for ${focusLabel}.`,
        is_correct: true,
        error_type: 'correct_strategy'
      },
      {
        option_id: `${base}_error_1`,
        value: `TODO: Add a common mistake for ${focusLabel}.`,
        is_correct: false,
        error_type: `${base}_common_error`
      },
      {
        option_id: `${base}_error_2`,
        value: `TODO: Add another plausible wrong option for ${focusLabel}.`,
        is_correct: false,
        error_type: `${base}_secondary_error`
      }
    ],
    correct_option_id: `${base}_correct`,
    explanation: `TODO: Explain why the correct choice is valid for ${focusLabel}.`
  };
}

function buildBlueprintTemplate({
  activityId,
  blueprintId,
  topic,
  type,
  difficulty = 'foundational'
}) {
  const normalizedType = slugify(type).replace(/-/g, '_') || 'sbra_pattern';

  return {
    sbra_blueprint: {
      blueprint_id: blueprintId,
      problem: `TODO: Replace with the real problem statement for ${activityId}.`,
      classification: {
        topic,
        type: normalizedType,
        difficulty
      },
      strategy: {
        summary: `TODO: Summarize the intended SBRA strategy for ${activityId}.`,
        methods: [normalizedType]
      },
      steps: [
        buildPlaceholderStep(1, 'setup'),
        buildPlaceholderStep(2, 'execution'),
        buildPlaceholderStep(3, 'verification')
      ],
      full_solution: [
        'TODO: Replace with the worked solution step 1.',
        'TODO: Replace with the worked solution step 2.',
        'TODO: Replace with the worked solution step 3.'
      ],
      misconception_map: [
        {
          error_type: 'step1_common_error',
          description: 'TODO: Describe the common mistake in the setup step.'
        },
        {
          error_type: 'step1_secondary_error',
          description: 'TODO: Describe the secondary setup error.'
        },
        {
          error_type: 'step2_common_error',
          description: 'TODO: Describe the common execution error.'
        },
        {
          error_type: 'step2_secondary_error',
          description: 'TODO: Describe the secondary execution error.'
        },
        {
          error_type: 'step3_common_error',
          description: 'TODO: Describe the common verification error.'
        },
        {
          error_type: 'step3_secondary_error',
          description: 'TODO: Describe the secondary verification error.'
        }
      ],
      scoring: {
        step_based: true
      }
    }
  };
}

function normalizeRegistry(registry) {
  return {
    registry_version: registry.registry_version || 'sbra-blueprint-registry-v1',
    items: Array.isArray(registry.items) ? registry.items.slice() : []
  };
}

function compareRegistryItems(left, right) {
  return left.activity_id.localeCompare(right.activity_id, undefined, { numeric: true, sensitivity: 'base' });
}

function upsertRegistryEntry(registry, entry, { force = false } = {}) {
  const nextRegistry = normalizeRegistry(registry);
  const existingByActivityId = nextRegistry.items.find((item) => item.activity_id === entry.activity_id);
  const conflictingBlueprintId = nextRegistry.items.find(
    (item) => item.blueprint_id === entry.blueprint_id && item.activity_id !== entry.activity_id
  );
  const conflictingFile = nextRegistry.items.find(
    (item) => item.file === entry.file && item.activity_id !== entry.activity_id
  );

  if (conflictingBlueprintId) {
    throw new Error(`registry already uses blueprint_id "${entry.blueprint_id}" for activity "${conflictingBlueprintId.activity_id}".`);
  }

  if (conflictingFile) {
    throw new Error(`registry already uses file "${entry.file}" for activity "${conflictingFile.activity_id}".`);
  }

  if (existingByActivityId && !force) {
    throw new Error(`registry already contains activity_id "${entry.activity_id}". Use --force to replace it.`);
  }

  nextRegistry.items = nextRegistry.items.filter((item) => item.activity_id !== entry.activity_id);
  nextRegistry.items.push(entry);
  nextRegistry.items.sort(compareRegistryItems);
  return nextRegistry;
}

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function createBlueprintScaffold({
  activityId,
  blueprintId,
  topic,
  type,
  difficulty = 'foundational',
  slug,
  blueprintDir = DEFAULT_BLUEPRINT_DIR,
  registryPath = DEFAULT_REGISTRY_PATH,
  force = false,
  dryRun = false
}) {
  if (!activityId || !blueprintId || !topic || !type) {
    throw new Error('activityId, blueprintId, topic, and type are required.');
  }

  const fileName = inferFilename(activityId, slug || type);
  const blueprintPath = path.join(blueprintDir, fileName);
  const registry = fs.existsSync(registryPath) ? loadRegistry(registryPath) : { registry_version: 'sbra-blueprint-registry-v1', items: [] };
  const templateDoc = buildBlueprintTemplate({
    activityId,
    blueprintId,
    topic,
    type,
    difficulty
  });
  const blueprintYaml = YAML.stringify(templateDoc, {
    defaultStringType: 'QUOTE_DOUBLE'
  });
  const nextRegistry = upsertRegistryEntry(
    registry,
    {
      activity_id: activityId,
      blueprint_id: blueprintId,
      file: fileName
    },
    { force }
  );

  if (!dryRun) {
    if (fs.existsSync(blueprintPath) && !force) {
      throw new Error(`blueprint file "${fileName}" already exists. Use --force to replace it.`);
    }

    ensureParentDirectory(blueprintPath);
    ensureParentDirectory(registryPath);
    fs.writeFileSync(blueprintPath, blueprintYaml, 'utf8');
    fs.writeFileSync(registryPath, `${JSON.stringify(nextRegistry, null, 2)}\n`, 'utf8');

    const { issues } = validateRegistryAndBlueprints(registryPath);
    const errors = issues.filter((issue) => issue.severity === 'error');
    if (errors.length > 0) {
      throw new Error(`scaffold validation failed: ${errors.map((issue) => issue.message).join(' | ')}`);
    }
  }

  return {
    activity_id: activityId,
    blueprint_id: blueprintId,
    file: fileName,
    blueprint_path: blueprintPath,
    registry_path: registryPath,
    dry_run: dryRun,
    preview: blueprintYaml,
    registry_preview: nextRegistry
  };
}

function parseCliArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith('--')));
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const [activityId, blueprintId, topic, type, difficulty, slug] = positional;

  return {
    activityId,
    blueprintId,
    topic,
    type,
    difficulty,
    slug,
    dryRun: flags.has('--dry-run'),
    force: flags.has('--force')
  };
}

if (require.main === module) {
  const options = parseCliArgs(process.argv.slice(2));

  if (!options.activityId || !options.blueprintId || !options.topic || !options.type) {
    console.error(
      'Usage: node tools/new-sbra-blueprint.js <activity_id> <blueprint_id> <topic> <type> [difficulty] [slug] [--dry-run] [--force]'
    );
    process.exit(1);
  }

  const result = createBlueprintScaffold(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

module.exports = {
  buildBlueprintTemplate,
  createBlueprintScaffold,
  inferFilename,
  parseCliArgs,
  slugify,
  upsertRegistryEntry
};
