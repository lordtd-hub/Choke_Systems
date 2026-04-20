'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoCourseWorkflow } = require('../tools/run-demo-course-workflow');
const { getCourseBuildHistoryFilePath, loadCourseBuildHistory } = require('../tools/build-history');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'build-history-'));

try {
  const outputRoot = path.join(tempRoot, 'outputs');
  const storageRoot = path.join(tempRoot, 'storage');

  runDemoCourseWorkflow({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    weeks: '1,3',
    outputRoot,
    storageRoot
  });

  runDemoCourseWorkflow({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    weeks: '1,2,3',
    outputRoot,
    storageRoot
  });

  const historyPath = getCourseBuildHistoryFilePath('SMAC001', outputRoot);
  const history = loadCourseBuildHistory('SMAC001', { outputRoot });

  assert.equal(fs.existsSync(historyPath), true);
  assert.equal(history.history_type, 'course_build_history_v1');
  assert.equal(history.course_id, 'SMAC001');
  assert.equal(history.runs.length, 2);
  assert.deepEqual(history.runs[0].generated_weeks, [1, 2, 3]);
  assert.deepEqual(history.runs[1].generated_weeks, [1, 3]);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('build history tests passed');
