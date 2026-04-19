'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const Ajv2020 = require('ajv/dist/2020');

const DEFAULT_BLUEPRINT_DIR = path.join(__dirname, '..', 'SBRA+interactive material', 'sbra_blueprints');
const DEFAULT_REGISTRY_PATH = path.join(DEFAULT_BLUEPRINT_DIR, 'registry.json');

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readYamlFile(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildAjv() {
  return new Ajv2020({
    allErrors: true,
    strict: false
  });
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || '/'} ${error.message}`);
}

function loadRegistry(registryPath = DEFAULT_REGISTRY_PATH) {
  return readJsonFile(registryPath);
}

function loadBlueprint(filePath) {
  return readYamlFile(filePath);
}

function validateBlueprint(blueprintDoc, schemaValidate) {
  const issues = [];
  if (!schemaValidate(blueprintDoc)) {
    formatAjvErrors(schemaValidate.errors).forEach((message) => {
      issues.push({ severity: 'error', message: `blueprint schema: ${message}` });
    });
    return issues;
  }

  const blueprint = blueprintDoc.sbra_blueprint;
  const stepNumbers = blueprint.steps.map((step) => step.step_no);
  stepNumbers.forEach((stepNo, index) => {
    if (stepNumbers.indexOf(stepNo) !== index) {
      issues.push({ severity: 'error', message: `blueprint "${blueprint.blueprint_id}" contains duplicate step_no ${stepNo}.` });
    }
  });

  const misconceptionTypes = new Set((blueprint.misconception_map || []).map((item) => item.error_type));

  blueprint.steps.forEach((step) => {
    const correctOptions = step.options.filter((option) => option.is_correct);
    if (correctOptions.length !== 1) {
      issues.push({
        severity: 'error',
        message: `blueprint "${blueprint.blueprint_id}" step ${step.step_no} must contain exactly 1 correct option.`
      });
    }

    if (!step.options.some((option) => option.option_id === step.correct_option_id)) {
      issues.push({
        severity: 'error',
        message: `blueprint "${blueprint.blueprint_id}" step ${step.step_no} references missing correct_option_id "${step.correct_option_id}".`
      });
    }

    step.options.forEach((option) => {
      if (!option.is_correct && option.error_type === 'correct_strategy') {
        issues.push({
          severity: 'warning',
          message: `blueprint "${blueprint.blueprint_id}" step ${step.step_no} uses "correct_strategy" on an incorrect option.`
        });
      }
      if (!option.is_correct && !misconceptionTypes.has(option.error_type)) {
        issues.push({
          severity: 'warning',
          message: `blueprint "${blueprint.blueprint_id}" step ${step.step_no} uses unmapped error_type "${option.error_type}".`
        });
      }
    });
  });

  return issues;
}

function validateRegistryAndBlueprints(registryPath = DEFAULT_REGISTRY_PATH) {
  const issues = [];
  const ajv = buildAjv();
  const registrySchema = readJsonFile(path.join(__dirname, '..', 'schemas', 'sbra_blueprint_registry.schema.json'));
  const blueprintSchema = readJsonFile(path.join(__dirname, '..', 'schemas', 'sbra_blueprint.schema.json'));
  const validateRegistry = ajv.compile(registrySchema);
  const validateBlueprintSchema = ajv.compile(blueprintSchema);
  const registry = loadRegistry(registryPath);

  if (!validateRegistry(registry)) {
    formatAjvErrors(validateRegistry.errors).forEach((message) => {
      issues.push({ severity: 'error', message: `registry schema: ${message}` });
    });
    return { registry, blueprintsByActivityId: new Map(), issues };
  }

  const activityIds = registry.items.map((item) => item.activity_id);
  activityIds.forEach((activityId, index) => {
    if (activityIds.indexOf(activityId) !== index) {
      issues.push({ severity: 'error', message: `registry contains duplicate activity_id "${activityId}".` });
    }
  });

  const blueprintsByActivityId = new Map();
  registry.items.forEach((entry) => {
    const blueprintPath = path.join(path.dirname(registryPath), entry.file);
    if (!fs.existsSync(blueprintPath)) {
      issues.push({ severity: 'error', message: `registry entry "${entry.activity_id}" points to missing file "${entry.file}".` });
      return;
    }

    const blueprintDoc = loadBlueprint(blueprintPath);
    validateBlueprint(blueprintDoc, validateBlueprintSchema).forEach((issue) => issues.push(issue));

    const blueprintId = blueprintDoc?.sbra_blueprint?.blueprint_id;
    if (blueprintId !== entry.blueprint_id) {
      issues.push({
        severity: 'error',
        message: `registry entry "${entry.activity_id}" expects blueprint_id "${entry.blueprint_id}" but file contains "${blueprintId}".`
      });
    }

    blueprintsByActivityId.set(entry.activity_id, blueprintDoc);
  });

  return { registry, blueprintsByActivityId, issues };
}

function resolveBlueprintForActivity(activityId, registryPath = DEFAULT_REGISTRY_PATH) {
  const { blueprintsByActivityId } = validateRegistryAndBlueprints(registryPath);
  return blueprintsByActivityId.get(activityId) || null;
}

if (require.main === module) {
  const registryPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : DEFAULT_REGISTRY_PATH;
  const { issues } = validateRegistryAndBlueprints(registryPath);
  issues.filter((issue) => issue.severity === 'error').forEach((issue) => console.error(`ERROR: ${issue.message}`));
  issues.filter((issue) => issue.severity === 'warning').forEach((issue) => console.warn(`WARN: ${issue.message}`));

  if (issues.filter((issue) => issue.severity === 'error').length === 0) {
    console.log(`SBRA blueprints validated with ${issues.filter((issue) => issue.severity === 'warning').length} warning(s).`);
  } else {
    process.exit(1);
  }
}

module.exports = {
  DEFAULT_BLUEPRINT_DIR,
  DEFAULT_REGISTRY_PATH,
  loadBlueprint,
  loadRegistry,
  resolveBlueprintForActivity,
  validateBlueprint,
  validateRegistryAndBlueprints
};
