'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoWeekWorkflow } = require('../tools/run-demo-week-workflow');
const { publishSystemOutputs } = require('../tools/publish-system-outputs');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'publish-system-outputs-'));

try {
  const outputRoot = path.join(tempRoot, 'outputs');
  const storageRoot = path.join(tempRoot, 'storage');

  runDemoWeekWorkflow({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    week: 3,
    outputRoot,
    storageRoot
  });

  const published = publishSystemOutputs({
    courseId: 'SMAC001',
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    outputRoot,
    storageRoot
  });

  assert.equal(fs.existsSync(published.course_dashboard_data_json), true);
  assert.equal(fs.existsSync(published.course_dashboard_html), true);
  assert.equal(fs.existsSync(published.catalog_dashboard_data_json), true);
  assert.equal(fs.existsSync(published.catalog_dashboard_html), true);
  assert.equal(fs.existsSync(published.course_output_registry_json), true);
  assert.equal(fs.existsSync(published.build_control_data_json), true);
  assert.equal(fs.existsSync(published.build_control_html), true);
  assert.equal(fs.existsSync(published.system_output_registry_json), true);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('publish system outputs tests passed');
