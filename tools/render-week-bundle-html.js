'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { buildWeekBundle } = require('./build-week-bundle');
const { DEFAULT_MANIFEST_PATH, loadManifest } = require('./material-library');
const { DEFAULT_REGISTRY_PATH, validateRegistryAndBlueprints } = require('./sbra-blueprints');
const { createRuntimeState, getRuntimeSummary } = require('./runtime-state');
const { renderWeekBundlePage } = require('../frontend/week-bundle-view');

function readYamlFile(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

if (require.main === module) {
  const [, , coursePathArg, weeklyPlanPathArg, weekArg, outputPathArg, manifestPathArg, registryPathArg] = process.argv;

  if (!coursePathArg || !weeklyPlanPathArg || !weekArg) {
    console.error(
      'Usage: node tools/render-week-bundle-html.js <course.yaml> <weekly_plan.yaml> <week> [output.html] [manifest.json] [registry.json]'
    );
    process.exit(1);
  }

  const coursePath = path.resolve(process.cwd(), coursePathArg);
  const weeklyPlanPath = path.resolve(process.cwd(), weeklyPlanPathArg);
  const weekNumber = Number(weekArg);
  const outputPath = outputPathArg ? path.resolve(process.cwd(), outputPathArg) : null;
  const manifestPath = manifestPathArg ? path.resolve(process.cwd(), manifestPathArg) : DEFAULT_MANIFEST_PATH;
  const registryPath = registryPathArg ? path.resolve(process.cwd(), registryPathArg) : DEFAULT_REGISTRY_PATH;
  const course = readYamlFile(coursePath);
  const weeklyPlan = readYamlFile(weeklyPlanPath);
  const manifest = loadManifest(manifestPath);
  const { blueprintsByActivityId, issues } = validateRegistryAndBlueprints(registryPath);
  const errors = issues.filter((issue) => issue.severity === 'error');

  if (errors.length > 0) {
    errors.forEach((issue) => console.error(`ERROR: ${issue.message}`));
    process.exit(1);
  }

  const bundle = buildWeekBundle(course, weeklyPlan, weekNumber, manifest, blueprintsByActivityId);
  const runtimeSummary = getRuntimeSummary(createRuntimeState(bundle, { now: '2026-04-19T00:00:00.000Z' }));
  const html = renderWeekBundlePage(bundle, runtimeSummary);

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html, 'utf8');
  } else {
    process.stdout.write(html);
  }
}
