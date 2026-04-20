'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { getCourseOutputFilePath } = require('./course-dashboard-data');
const { getCatalogOutputFilePath } = require('./catalog-dashboard-data');
const { buildInstructorBuildControlData, getInstructorControlOutputFilePath } = require('./instructor-build-control-data');
const { runDemoWeekWorkflow } = require('./run-demo-week-workflow');
const { renderInstructorBuildControlPage } = require('../frontend/instructor-build-control-view');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJsonFile(filePath, payload) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function writeTextFile(filePath, content) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function parseWeekList(weeksInput, weeklyPlan) {
  const availableWeeks = (weeklyPlan?.weekly_plan?.weekly_units || []).map((unit) => Number(unit.week));

  if (!weeksInput) {
    return availableWeeks;
  }

  const parsedWeeks = String(weeksInput)
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);

  if (parsedWeeks.length === 0) {
    throw new Error('weeks must contain at least one positive integer.');
  }

  const unknownWeeks = parsedWeeks.filter((week) => !availableWeeks.includes(week));
  if (unknownWeeks.length > 0) {
    throw new Error(`Unknown weeks requested: ${unknownWeeks.join(', ')}`);
  }

  return [...new Set(parsedWeeks)].sort((left, right) => left - right);
}

function renderThaiCourseWorkflowSummary(summary) {
  const lines = [
    '# สรุปผลการสร้างงานระดับรายวิชา',
    '',
    `- รายวิชา: ${summary.context.course_id}`,
    `- จำนวนสัปดาห์ที่สร้าง: ${summary.generated_week_count}`,
    `- สัปดาห์ที่สร้าง: ${summary.generated_weeks.join(', ')}`,
    '',
    '## ไฟล์หลัก',
    '',
    `- แดชบอร์ดรายวิชา JSON: ${summary.files.course_dashboard_data_json}`,
    `- แดชบอร์ดรายวิชา HTML: ${summary.files.course_dashboard_html}`,
    `- แคตตาล็อกระบบ JSON: ${summary.files.catalog_dashboard_data_json}`,
    `- แคตตาล็อกระบบ HTML: ${summary.files.catalog_dashboard_html}`,
    '',
    '## สัปดาห์ที่ถูกสร้าง',
    ''
  ];

  summary.week_runs.forEach((weekRun) => {
    lines.push(`- สัปดาห์ที่ ${weekRun.context.week}: ${weekRun.files.dashboard_html}`);
  });

  return `${lines.join('\n')}\n`;
}

function runDemoCourseWorkflow({
  coursePath,
  weeklyPlanPath,
  weeks,
  outputRoot = path.join(process.cwd(), 'outputs'),
  storageRoot
}) {
  const resolvedCoursePath = path.resolve(process.cwd(), coursePath);
  const resolvedWeeklyPlanPath = path.resolve(process.cwd(), weeklyPlanPath);
  const weeklyPlan = readYaml(resolvedWeeklyPlanPath);
  const weekNumbers = parseWeekList(weeks, weeklyPlan);
  const weekRuns = weekNumbers.map((weekNumber) => runDemoWeekWorkflow({
    coursePath: resolvedCoursePath,
    weeklyPlanPath: resolvedWeeklyPlanPath,
    week: weekNumber,
    outputRoot,
    storageRoot
  }));

  if (weekRuns.length === 0) {
    throw new Error('No weeks were generated.');
  }

  const courseId = weekRuns[0].context.course_id;
  const courseSummaryJsonPath = getCourseOutputFilePath(courseId, 'course-workflow-summary.json', outputRoot);
  const courseSummaryMarkdownPath = getCourseOutputFilePath(courseId, 'course-workflow-summary.md', outputRoot);
  const summary = {
    workflow_type: 'demo_course_workflow_v1',
    context: {
      course_id: courseId
    },
    generated_week_count: weekRuns.length,
    generated_weeks: weekRuns.map((item) => item.context.week),
    week_runs: weekRuns,
    files: {
      course_dashboard_data_json: getCourseOutputFilePath(courseId, 'course-dashboard-data.json', outputRoot),
      course_dashboard_html: getCourseOutputFilePath(courseId, 'course-dashboard.html', outputRoot),
      catalog_dashboard_data_json: getCatalogOutputFilePath('catalog-dashboard-data.json', outputRoot),
      catalog_dashboard_html: getCatalogOutputFilePath('catalog-dashboard.html', outputRoot),
      course_workflow_summary_json: courseSummaryJsonPath,
      course_workflow_summary_markdown: courseSummaryMarkdownPath
    }
  };

  writeJsonFile(courseSummaryJsonPath, summary);
  writeTextFile(courseSummaryMarkdownPath, renderThaiCourseWorkflowSummary(summary));

  const buildControlDataPath = getInstructorControlOutputFilePath('build-control-data.json', outputRoot);
  const buildControlHtmlPath = getInstructorControlOutputFilePath('build-control.html', outputRoot);
  const buildControlData = buildInstructorBuildControlData({
    coursePath: resolvedCoursePath,
    weeklyPlanPath: resolvedWeeklyPlanPath,
    outputRoot
  });
  writeJsonFile(buildControlDataPath, buildControlData);
  writeTextFile(buildControlHtmlPath, renderInstructorBuildControlPage(buildControlData));

  return summary;
}

if (require.main === module) {
  const [, , coursePathArg, weeklyPlanPathArg, weeksArg, outputRootArg, storageRootArg] = process.argv;

  if (!coursePathArg || !weeklyPlanPathArg) {
    console.error(
      'Usage: node tools/run-demo-course-workflow.js <course.yaml> <weekly_plan.yaml> [weeks_csv] [output-root] [storage-root]'
    );
    process.exit(1);
  }

  const summary = runDemoCourseWorkflow({
    coursePath: coursePathArg,
    weeklyPlanPath: weeklyPlanPathArg,
    weeks: weeksArg,
    outputRoot: outputRootArg ? path.resolve(process.cwd(), outputRootArg) : path.join(process.cwd(), 'outputs'),
    storageRoot: storageRootArg ? path.resolve(process.cwd(), storageRootArg) : undefined
  });

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

module.exports = {
  parseWeekList,
  runDemoCourseWorkflow
};
