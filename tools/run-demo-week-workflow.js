'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { createDemoLearningArtifacts } = require('./render-demo-cqi-report');
const { saveLearningArtifacts, getArtifactDirectory } = require('./persistence');
const { buildTeacherDashboardData } = require('./teacher-dashboard-data');
const { publishSystemOutputs } = require('./publish-system-outputs');
const { renderTeacherDashboardPage } = require('../frontend/teacher-dashboard-view');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeTextFile(filePath, content) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeJsonFile(filePath, payload) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function formatRuntimeStatus(value) {
  const labels = {
    not_started: 'ยังไม่เริ่ม',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น'
  };

  return labels[value] || value || 'ไม่มีข้อมูล';
}

function renderThaiWorkflowSummary(summary) {
  const lines = [
    '# สรุปผลการสร้างงานสัปดาห์ตัวอย่าง',
    '',
    `- รายวิชา: ${summary.context.course_id}`,
    `- โมดูล: ${summary.context.module_id}`,
    `- สัปดาห์ที่: ${summary.context.week}`,
    `- โฟลเดอร์ output: ${summary.output_directory}`,
    `- โฟลเดอร์จัดเก็บข้อมูลการทำงาน: ${summary.saved_artifact_directory}`,
    '',
    '## ไฟล์สำคัญ',
    '',
    `- ข้อมูลชุดบทเรียน: ${summary.files.week_bundle_json}`,
    `- หน้าแสดงผลบทเรียน: ${summary.files.week_bundle_html}`,
    `- รายงาน CQI: ${summary.files.cqi_report_markdown}`,
    `- ข้อมูลสถานะการเรียน: ${summary.files.runtime_state_json}`,
    `- ผลการประเมิน: ${summary.files.assessment_results_json}`,
    `- เหตุการณ์วิเคราะห์การเรียนรู้: ${summary.files.analytics_events_json}`,
    `- รายงาน CQI แบบ JSON: ${summary.files.cqi_report_json}`,
    '',
    '## สรุปความก้าวหน้า',
    '',
    `- สถานะ: ${formatRuntimeStatus(summary.runtime_summary.status)}`,
    `- ความคืบหน้า: ${summary.runtime_summary.progress_percent}%`,
    `- ส่วนที่ต้องทำเสร็จแล้ว: ${summary.runtime_summary.required_sections_completed}/${summary.runtime_summary.required_sections_total}`,
    `- กิจกรรมที่ต้องทำเสร็จแล้ว: ${summary.runtime_summary.required_activities_completed}/${summary.runtime_summary.required_activities_total}`
  ];

  return `${lines.join('\n')}\n`;
}

function runDemoWeekWorkflow({
  coursePath,
  weeklyPlanPath,
  week,
  outputRoot = path.join(process.cwd(), 'outputs'),
  storageRoot
}) {
  const resolvedCoursePath = path.resolve(process.cwd(), coursePath);
  const resolvedWeeklyPlanPath = path.resolve(process.cwd(), weeklyPlanPath);
  const weekNumber = Number(week);

  if (!Number.isInteger(weekNumber) || weekNumber < 1) {
    throw new Error('week must be a positive integer.');
  }

  const course = readYaml(resolvedCoursePath);
  const weeklyPlan = readYaml(resolvedWeeklyPlanPath);
  const artifacts = createDemoLearningArtifacts(course, weeklyPlan, weekNumber);
  const context = {
    course_id: artifacts.bundle.interactive_module.course_id,
    module_id: artifacts.bundle.interactive_module.module_id,
    week: artifacts.bundle.interactive_module.week
  };

  const weekOutputDir = path.join(
    outputRoot,
    context.course_id,
    context.module_id,
    `week-${String(context.week).padStart(2, '0')}`
  );
  ensureDirectory(weekOutputDir);

  const bundleJsonPath = path.join(weekOutputDir, 'week-bundle.json');
  const frontendHtmlPath = path.join(weekOutputDir, 'week-bundle.html');
  const cqiMarkdownPath = path.join(weekOutputDir, 'cqi-report.md');
  const dashboardDataJsonPath = path.join(weekOutputDir, 'dashboard-data.json');
  const dashboardHtmlPath = path.join(weekOutputDir, 'dashboard.html');
  const summaryMarkdownPath = path.join(weekOutputDir, 'workflow-summary.md');
  const summaryJsonPath = path.join(weekOutputDir, 'workflow-summary.json');

  writeJsonFile(bundleJsonPath, artifacts.bundle);
  writeTextFile(frontendHtmlPath, artifacts.bundleHtml);
  writeTextFile(cqiMarkdownPath, `${artifacts.cqiMarkdown}\n`);

  const persisted = saveLearningArtifacts({
    runtimeState: artifacts.runtimeState,
    assessmentResults: artifacts.assessmentResults,
    analyticsEvents: artifacts.cqiReport.source_events,
    cqiReport: artifacts.cqiReport,
    storageRoot
  });

  const summary = {
    generated_at: new Date().toISOString(),
    context,
    output_directory: weekOutputDir,
    saved_artifact_directory: persisted.directory || getArtifactDirectory(context, storageRoot),
    files: {
      week_bundle_json: bundleJsonPath,
      week_bundle_html: frontendHtmlPath,
      cqi_report_markdown: cqiMarkdownPath,
      dashboard_data_json: dashboardDataJsonPath,
      dashboard_html: dashboardHtmlPath,
      workflow_summary_markdown: summaryMarkdownPath,
      runtime_state_json: persisted.runtime_state,
      assessment_results_json: persisted.assessment_results,
      analytics_events_json: persisted.analytics_events,
      cqi_report_json: persisted.cqi_report
    },
    runtime_summary: artifacts.runtimeSummary
  };

  writeTextFile(summaryMarkdownPath, renderThaiWorkflowSummary(summary));
  writeJsonFile(summaryJsonPath, summary);

  const dashboardData = buildTeacherDashboardData(context, {
    outputRoot,
    storageRoot,
    coursePath: resolvedCoursePath
  });
  writeJsonFile(dashboardDataJsonPath, dashboardData);
  writeTextFile(dashboardHtmlPath, renderTeacherDashboardPage(dashboardData));

  publishSystemOutputs({
    courseId: context.course_id,
    coursePath: resolvedCoursePath,
    weeklyPlanPath: resolvedWeeklyPlanPath,
    outputRoot,
    storageRoot
  });

  return summary;
}

if (require.main === module) {
  const [, , coursePathArg, weeklyPlanPathArg, weekArg, outputRootArg, storageRootArg] = process.argv;

  if (!coursePathArg || !weeklyPlanPathArg || !weekArg) {
    console.error(
      'Usage: node tools/run-demo-week-workflow.js <course.yaml> <weekly_plan.yaml> <week> [output-root] [storage-root]'
    );
    process.exit(1);
  }

  const summary = runDemoWeekWorkflow({
    coursePath: coursePathArg,
    weeklyPlanPath: weeklyPlanPathArg,
    week: weekArg,
    outputRoot: outputRootArg ? path.resolve(process.cwd(), outputRootArg) : path.join(process.cwd(), 'outputs'),
    storageRoot: storageRootArg ? path.resolve(process.cwd(), storageRootArg) : undefined
  });

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

module.exports = {
  runDemoWeekWorkflow
};
