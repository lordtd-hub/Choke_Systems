'use strict';

const path = require('node:path');
const fs = require('node:fs');
const YAML = require('yaml');
const Ajv2020 = require('ajv/dist/2020');
const { buildInteractiveModule } = require('./build-interactive-module');
const { DEFAULT_MANIFEST_PATH, loadManifest, resolveWeeklyMaterials, validateManifest } = require('./material-library');
const { DEFAULT_REGISTRY_PATH, validateRegistryAndBlueprints } = require('./sbra-blueprints');

function readYamlFile(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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

function pickDefined(source) {
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== undefined));
}

function buildWeekBundle(course, weeklyPlan, weekNumber, manifest, sbraBlueprintsByActivityId = new Map()) {
  const courseRoot = course.course;
  const weeklyUnit = weeklyPlan.weekly_plan.weekly_units.find((unit) => unit.week === weekNumber);
  if (!weeklyUnit) {
    throw new Error(`Week ${weekNumber} was not found in weekly plan.`);
  }

  const rubricById = new Map((((courseRoot.rubrics || {}).rubric_catalog) || []).map((rubric) => [rubric.rubric_id, rubric]));

  return {
    interactive_module: buildInteractiveModule(course, weeklyPlan, weekNumber).interactive_module,
    supplementary_materials: resolveWeeklyMaterials(weeklyUnit, manifest).map((item) => ({
      ...pickDefined({
        id: item.id,
        topic: item.topic,
        title: item.title,
        description: item.description,
        type: item.type,
        path: item.path,
        url: item.url,
        tags: item.tags || [],
        addedDate: item.addedDate
      })
    })),
    sbra_payloads: weeklyUnit.activities
      .filter((activity) => activity.activity_type_id === 'ACT-SBRA')
      .map((activity) => ({
        activity_id: activity.activity_id,
        name: activity.name,
        deliverable: activity.deliverable,
        assessment_links: activity.assessment_links || [],
        evidence_tags: activity.evidence_tags || [],
        clo_mapping: {
          primary: activity.primary_clo,
          secondary: activity.secondary_clos || []
        },
        rubric: activity.rubric_id
          ? {
              rubric_id: activity.rubric_id,
              ...(rubricById.get(activity.rubric_id) || {})
            }
          : null,
        blueprint: sbraBlueprintsByActivityId.get(activity.activity_id)?.sbra_blueprint || null
      }))
  };
}

function validateWeekBundle(bundle) {
  const ajv = buildAjv();
  const schema = readJsonFile(path.join(__dirname, '..', 'schemas', 'week_bundle.schema.json'));
  const validate = ajv.compile(schema);
  const isValid = validate(bundle);

  return {
    isValid,
    errors: formatAjvErrors(validate.errors)
  };
}

function validateWeekBundleIntegrity(bundle) {
  const errors = [];
  const moduleRoot = bundle.interactive_module;
  const moduleActivitiesById = new Map(moduleRoot.activities.map((activity) => [activity.activity_id, activity]));
  const moduleSbraActivityIds = moduleRoot.activities
    .filter((activity) => activity.type === 'sbra')
    .map((activity) => activity.activity_id);
  const payloadActivityIds = bundle.sbra_payloads.map((payload) => payload.activity_id);
  const materialIds = bundle.supplementary_materials.map((item) => item.id);

  materialIds.forEach((materialId, index) => {
    if (materialIds.indexOf(materialId) !== index) {
      errors.push(`supplementary_materials contains duplicate id "${materialId}".`);
    }
  });

  payloadActivityIds.forEach((activityId, index) => {
    if (payloadActivityIds.indexOf(activityId) !== index) {
      errors.push(`sbra_payloads contains duplicate activity_id "${activityId}".`);
    }
  });

  bundle.sbra_payloads.forEach((payload) => {
    const moduleActivity = moduleActivitiesById.get(payload.activity_id);
    if (!moduleActivity) {
      errors.push(`sbra_payloads references missing interactive activity "${payload.activity_id}".`);
      return;
    }

    if (moduleActivity.type !== 'sbra') {
      errors.push(`sbra_payload "${payload.activity_id}" must map to an interactive activity of type "sbra".`);
    }
  });

  moduleSbraActivityIds.forEach((activityId) => {
    if (!payloadActivityIds.includes(activityId)) {
      errors.push(`interactive_module SBRA activity "${activityId}" is missing from sbra_payloads.`);
    }
  });

  return errors;
}

if (require.main === module) {
  const [, , coursePathArg, weeklyPlanPathArg, weekArg, manifestPathArg, registryPathArg] = process.argv;

  if (!coursePathArg || !weeklyPlanPathArg || !weekArg) {
    console.error('Usage: node tools/build-week-bundle.js <course.yaml> <weekly_plan.yaml> <week> [manifest.json]');
    process.exit(1);
  }

  const coursePath = path.resolve(process.cwd(), coursePathArg);
  const weeklyPlanPath = path.resolve(process.cwd(), weeklyPlanPathArg);
  const manifestPath = manifestPathArg ? path.resolve(process.cwd(), manifestPathArg) : DEFAULT_MANIFEST_PATH;
  const registryPath = registryPathArg ? path.resolve(process.cwd(), registryPathArg) : DEFAULT_REGISTRY_PATH;
  const weekNumber = Number(weekArg);
  const course = readYamlFile(coursePath);
  const weeklyPlan = readYamlFile(weeklyPlanPath);
  const manifest = loadManifest(manifestPath);
  const issues = validateManifest(manifest, manifestPath).filter((issue) => issue.severity === 'error');
  if (issues.length > 0) {
    issues.forEach((issue) => console.error(`ERROR: ${issue.message}`));
    process.exit(1);
  }

  const { issues: sbraIssues, blueprintsByActivityId } = validateRegistryAndBlueprints(registryPath);
  const sbraErrors = sbraIssues.filter((issue) => issue.severity === 'error');
  if (sbraErrors.length > 0) {
    sbraErrors.forEach((issue) => console.error(`ERROR: ${issue.message}`));
    process.exit(1);
  }

  const bundle = buildWeekBundle(course, weeklyPlan, weekNumber, manifest, blueprintsByActivityId);
  const schemaValidation = validateWeekBundle(bundle);
  const integrityErrors = validateWeekBundleIntegrity(bundle);

  if (!schemaValidation.isValid) {
    schemaValidation.errors.forEach((message) => console.error(`ERROR: ${message}`));
    process.exit(1);
  }

  if (integrityErrors.length > 0) {
    integrityErrors.forEach((message) => console.error(`ERROR: ${message}`));
    process.exit(1);
  }

  process.stdout.write(`${JSON.stringify(bundle, null, 2)}\n`);
}

module.exports = {
  buildWeekBundle,
  validateWeekBundle,
  validateWeekBundleIntegrity
};
