'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoCourseWorkflow } = require('../tools/run-demo-course-workflow');
const { buildControlStatusSummary, getControlStatusSummaryFilePath } = require('../tools/control-status-summary');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'control-status-summary-'));

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

  const summary = buildControlStatusSummary({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    outputRoot
  });
  const summaryPath = getControlStatusSummaryFilePath(outputRoot);

  assert.equal(summary.summary_type, 'control_status_summary_v1');
  assert.equal(summary.current_phase.phase, 'P5-PRODUCT');
  assert.equal(summary.current_phase.position, 'transition planning');
  assert.equal(summary.current_status.completed_layers.includes('spec core'), true);
  assert.equal(summary.current_status.in_progress.includes('first `P5-PRODUCT` transition-planning slice'), true);
  assert.equal(summary.current_status.next_focus.includes('define the first product-layer boundary before implementation starts'), true);
  assert.equal(summary.locked_task.task_id, 'P5-PLAN-001');
  assert.equal(summary.next_recommended_action.action_type, 'build_next_missing_week');
  assert.equal(summary.next_phase_target.phase, null);
  assert.equal(summary.next_phase_target.exit_criteria.length, 0);
  assert.equal(fs.existsSync(summaryPath), true);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('control status summary tests passed');
