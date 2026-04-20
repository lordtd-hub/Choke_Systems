'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoCourseWorkflow } = require('../tools/run-demo-course-workflow');
const { buildCourseActionQueue, getCourseActionQueueFilePath } = require('../tools/course-action-queue');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'course-action-queue-'));

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

  const queue = buildCourseActionQueue({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    outputRoot
  });
  const queuePath = getCourseActionQueueFilePath('SMAC001', outputRoot);

  assert.equal(queue.queue_type, 'course_action_queue_v1');
  assert.equal(queue.context.course_id, 'SMAC001');
  assert.equal(queue.overview.missing_week_count, 12);
  assert.equal(queue.overview.partial_week_count, 0);
  assert.equal(queue.actions.length >= 2, true);
  assert.equal(queue.actions[0].priority, 'medium');
  assert.equal(queue.actions[0].action_type, 'build_next_missing_week');
  assert.deepEqual(queue.actions[0].weeks, [4]);
  assert.equal(queue.actions[0].command.includes('4'), true);
  assert.equal(fs.existsSync(queuePath), true);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('course action queue tests passed');
