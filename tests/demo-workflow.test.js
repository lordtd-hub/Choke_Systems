'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoWeekWorkflow } = require('../tools/run-demo-week-workflow');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'demo-workflow-'));

try {
  const outputRoot = path.join(tempRoot, 'outputs');
  const storageRoot = path.join(tempRoot, 'storage');
  const summary = runDemoWeekWorkflow({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    week: 3,
    outputRoot,
    storageRoot
  });

  assert.equal(summary.context.course_id, 'SMAC001');
  assert.equal(summary.context.module_id, 'SMAC001_w03');
  assert.equal(summary.context.week, 3);
  assert.equal(fs.existsSync(summary.files.week_bundle_json), true);
  assert.equal(fs.existsSync(summary.files.week_bundle_html), true);
  assert.equal(fs.existsSync(summary.files.cqi_report_markdown), true);
  assert.equal(fs.existsSync(summary.files.runtime_state_json), true);
  assert.equal(fs.existsSync(summary.files.assessment_results_json), true);
  assert.equal(fs.existsSync(summary.files.analytics_events_json), true);
  assert.equal(fs.existsSync(summary.files.cqi_report_json), true);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('demo workflow tests passed');
