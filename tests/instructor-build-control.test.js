'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoCourseWorkflow } = require('../tools/run-demo-course-workflow');
const { buildInstructorBuildControlData, getInstructorControlOutputFilePath } = require('../tools/instructor-build-control-data');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'instructor-build-control-'));

try {
  const outputRoot = path.join(tempRoot, 'outputs');
  const storageRoot = path.join(tempRoot, 'storage');

  const summary = runDemoCourseWorkflow({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    weeks: '1,2,3',
    outputRoot,
    storageRoot
  });

  const controlData = buildInstructorBuildControlData({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    outputRoot
  });
  const controlHtmlPath = getInstructorControlOutputFilePath('build-control.html', outputRoot);
  const controlJsonPath = getInstructorControlOutputFilePath('build-control-data.json', outputRoot);
  const html = fs.readFileSync(controlHtmlPath, 'utf8');

  assert.equal(summary.generated_week_count, 3);
  assert.equal(controlData.control_type, 'instructor_build_control_v1');
  assert.equal(controlData.context.course_id, 'SMAC001');
  assert.equal(controlData.presets.length, 3);
  assert.deepEqual(controlData.presets[1].weeks, [1, 2, 3]);
  assert.equal(controlData.latest_run.generated_week_count, 3);
  assert.equal(controlData.recent_runs.length >= 1, true);
  assert.deepEqual(controlData.recent_runs[0].generated_weeks, [1, 2, 3]);
  assert.equal(controlData.output_health.completed_week_count, 3);
  assert.equal(controlData.output_health.partial_week_count, 0);
  assert.equal(controlData.output_health.missing_week_count, 12);
  assert.deepEqual(controlData.output_health.completed_weeks, [1, 2, 3]);
  assert.equal(controlData.current_outputs.course_output_registry_json.endsWith('course-output-registry.json'), true);
  assert.equal(controlData.current_outputs.course_action_queue_json.endsWith('course-action-queue.json'), true);
  assert.equal(controlData.current_outputs.control_status_summary_json.endsWith('control-status-summary.json'), true);
  assert.equal(controlData.recommended_actions.length >= 2, true);
  assert.equal(controlData.recommended_actions[0].action_type, 'build_next_missing_week');
  assert.equal(controlData.output_registry_overview.complete_week_count, 3);
  assert.equal(controlData.week_directory.length, 15);
  assert.equal(controlData.week_directory[0].title, 'Introduction, Functions, and Readiness Check');
  assert.equal(controlData.week_directory[0].status, 'complete');
  assert.equal(controlData.week_directory[0].available_file_count, 4);
  assert.equal(controlData.week_directory[3].status, 'missing');
  assert.equal(fs.existsSync(controlJsonPath), true);
  assert.equal(fs.existsSync(controlHtmlPath), true);
  assert.match(html, /ศูนย์ควบคุมการสร้างงานสำหรับอาจารย์/);
  assert.match(html, /ชุดคำสั่งแนะนำ/);
  assert.match(html, /ประวัติการรันล่าสุด/);
  assert.match(html, /งานถัดไปที่แนะนำ/);
  assert.match(html, /สร้างสัปดาห์ถัดไปที่ยังไม่มี output/);
  assert.match(html, /สถานะความครบของ output/);
  assert.match(html, /ไดเรกทอรี output รายสัปดาห์/);
  assert.match(html, /สัปดาห์ที่ยังขาดไฟล์/);
  assert.match(html, /\.\/SMAC001\/SMAC001_w01\/week-01\/dashboard\.html/);
  assert.match(html, /course-action-queue\.json/);
  assert.match(html, /course-output-registry\.json/);
  assert.match(html, /build-history\.json/);
  assert.match(html, /build-control-data\.json/);
  assert.match(html, /node tools\/run-demo-course-workflow\.js/);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('instructor build control tests passed');
