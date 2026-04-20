'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoCourseWorkflow } = require('../tools/run-demo-course-workflow');
const { buildSystemOutputRegistry, getSystemOutputRegistryFilePath } = require('../tools/system-output-registry');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'system-output-registry-'));

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

  const registry = buildSystemOutputRegistry({ outputRoot });
  const registryPath = getSystemOutputRegistryFilePath(outputRoot);

  assert.equal(registry.registry_type, 'system_output_registry_v1');
  assert.equal(registry.top_level_files.length, 4);
  assert.equal(registry.top_level_files[0].exists, true);
  assert.equal(registry.courses.length, 1);
  assert.equal(registry.courses[0].course_id, 'SMAC001');
  assert.equal(registry.courses[0].files.course_output_registry_json.exists, true);
  assert.equal(registry.courses[0].output_overview.complete_week_count, 3);
  assert.equal(fs.existsSync(registryPath), true);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('system output registry tests passed');
