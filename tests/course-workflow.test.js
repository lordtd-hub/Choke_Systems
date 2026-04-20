'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseWeekList, runDemoCourseWorkflow } = require('../tools/run-demo-course-workflow');
const YAML = require('yaml');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'course-workflow-'));

try {
  const weeklyPlan = readYaml(path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'));
  assert.deepEqual(parseWeekList('1,3,3', weeklyPlan), [1, 3]);

  const outputRoot = path.join(tempRoot, 'outputs');
  const storageRoot = path.join(tempRoot, 'storage');
  const summary = runDemoCourseWorkflow({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    weeks: '1,3',
    outputRoot,
    storageRoot
  });

  assert.equal(summary.workflow_type, 'demo_course_workflow_v1');
  assert.equal(summary.context.course_id, 'SMAC001');
  assert.equal(summary.generated_week_count, 2);
  assert.deepEqual(summary.generated_weeks, [1, 3]);
  assert.equal(summary.week_runs.length, 2);
  assert.equal(summary.week_runs[0].context.week, 1);
  assert.equal(summary.week_runs[1].context.week, 3);
  assert.equal(fs.existsSync(summary.files.course_dashboard_data_json), true);
  assert.equal(fs.existsSync(summary.files.course_dashboard_html), true);
  assert.equal(fs.existsSync(summary.files.catalog_dashboard_data_json), true);
  assert.equal(fs.existsSync(summary.files.catalog_dashboard_html), true);
  assert.equal(fs.existsSync(summary.files.course_workflow_summary_json), true);
  assert.equal(fs.existsSync(summary.files.course_workflow_summary_markdown), true);
  assert.equal(fs.existsSync(summary.files.course_output_registry_json), true);
  assert.equal(fs.existsSync(path.join(outputRoot, 'build-control-data.json')), true);
  assert.equal(fs.existsSync(path.join(outputRoot, 'build-control.html')), true);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('course workflow tests passed');
