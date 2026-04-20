'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { runDemoWeekWorkflow } = require('../tools/run-demo-week-workflow');
const { buildTeacherDashboardData } = require('../tools/teacher-dashboard-data');
const { buildCourseDashboardData } = require('../tools/course-dashboard-data');
const { createDemoLearningArtifacts } = require('../tools/render-demo-cqi-report');
const { buildCqiReport, renderCqiReportMarkdown } = require('../tools/cqi-report');
const { createLearningRecordProjectionServices, buildLearningRecordIdentity } = require('../tools/learning-record-read-layer');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'learning-record-output-rewire-'));

try {
  const outputRoot = path.join(tempRoot, 'outputs');
  const storageRoot = path.join(tempRoot, 'storage');
  const coursePath = path.join(__dirname, '..', 'calculus1_course.yaml');
  const weeklyPlanPath = path.join(__dirname, '..', 'calculus1_weekly_plan.yaml');
  const course = readYaml(coursePath);
  const weeklyPlan = readYaml(weeklyPlanPath);

  runDemoWeekWorkflow({
    coursePath,
    weeklyPlanPath,
    week: 1,
    outputRoot,
    storageRoot
  });
  runDemoWeekWorkflow({
    coursePath,
    weeklyPlanPath,
    week: 3,
    outputRoot,
    storageRoot
  });

  const { projectionAssemblyService } = createLearningRecordProjectionServices({ storageRoot });
  const week3Bundle = JSON.parse(fs.readFileSync(
    path.join(outputRoot, 'SMAC001', 'SMAC001_w03', 'week-03', 'week-bundle.json'),
    'utf8'
  ));
  const week1Bundle = JSON.parse(fs.readFileSync(
    path.join(outputRoot, 'SMAC001', 'SMAC001_w01', 'week-01', 'week-bundle.json'),
    'utf8'
  ));
  const week3Identity = buildLearningRecordIdentity({
    course_id: 'SMAC001',
    module_id: 'SMAC001_w03',
    week: 3
  });

  const teacherDashboardData = buildTeacherDashboardData(
    { course_id: 'SMAC001', module_id: 'SMAC001_w03', week: 3 },
    { outputRoot, storageRoot, coursePath }
  );
  const teacherProjection = projectionAssemblyService.buildTeacherWeekProjection({
    identity: week3Identity,
    course,
    bundle: week3Bundle
  });

  assert.deepEqual(teacherDashboardData.module, teacherProjection.module);
  assert.deepEqual(teacherDashboardData.runtime_summary, teacherProjection.runtime_summary);
  assert.equal(
    teacherDashboardData.artifact_counts.assessment_results,
    teacherProjection.canonical_counts.assessment_result_records
  );
  assert.equal(
    teacherDashboardData.cqi_summary.attained_clos,
    teacherProjection.cqi_summary.attained_clos
  );

  const courseDashboardData = buildCourseDashboardData('SMAC001', {
    coursePath,
    outputRoot,
    storageRoot
  });
  const courseProjection = projectionAssemblyService.buildCourseProjection({
    course,
    weeks: [
      { identity: buildLearningRecordIdentity({ course_id: 'SMAC001', module_id: 'SMAC001_w01', week: 1 }), bundle: week1Bundle },
      { identity: week3Identity, bundle: week3Bundle }
    ]
  });

  assert.deepEqual(courseDashboardData.overview, courseProjection.overview);

  const artifacts = createDemoLearningArtifacts(course, weeklyPlan, 3);
  const cqiReport = buildCqiReport({
    course,
    bundle: artifacts.bundle,
    runtimeState: artifacts.runtimeState,
    assessmentResults: artifacts.assessmentResults,
    reflections: artifacts.reflections,
    generatedAt: artifacts.runtimeState.runtime_state.updated_at
  });
  const markdown = renderCqiReportMarkdown(cqiReport);

  assert.equal(cqiReport.report_type, 'cqi_summary_v1');
  assert.equal(cqiReport.context.course_id, 'SMAC001');
  assert.equal(cqiReport.context.module_id, 'SMAC001_w03');
  assert.equal(cqiReport.context.week, 3);
  assert.ok(cqiReport.clo_reports.length >= 5);
  assert.ok(markdown.includes('# รายงานสรุป CQI'));
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('learning record output rewire tests passed');
