'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoCourseWorkflow } = require('../tools/run-demo-course-workflow');
const { buildCourseOutputRegistry, getCourseOutputRegistryFilePath } = require('../tools/output-registry');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'output-registry-'));

try {
  const outputRoot = path.join(tempRoot, 'outputs');
  const storageRoot = path.join(tempRoot, 'storage');

  runDemoCourseWorkflow({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    weeks: '1,2,3',
    outputRoot,
    storageRoot
  });

  const registry = buildCourseOutputRegistry({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    outputRoot
  });
  const registryPath = getCourseOutputRegistryFilePath('SMAC001', outputRoot);

  assert.equal(registry.registry_type, 'course_output_registry_v1');
  assert.equal(registry.context.course_id, 'SMAC001');
  assert.equal(registry.overview.total_weeks, 15);
  assert.equal(registry.overview.complete_week_count, 3);
  assert.equal(registry.overview.partial_week_count, 0);
  assert.equal(registry.overview.missing_week_count, 12);
  assert.equal(registry.overview.completion_percent, 20);
  assert.equal(registry.weeks.length, 15);
  assert.equal(registry.weeks[0].title, 'Introduction, Functions, and Readiness Check');
  assert.equal(registry.weeks[0].status, 'complete');
  assert.equal(registry.weeks[0].files[0].exists, true);
  assert.equal(registry.weeks[0].latest_generated_at !== null, true);
  assert.equal(registry.weeks[3].status, 'missing');
  assert.equal(fs.existsSync(registryPath), true);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('output registry tests passed');
