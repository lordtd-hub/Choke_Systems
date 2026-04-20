'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { DEFAULT_OUTPUT_ROOT, getCourseOutputFilePath } = require('./course-dashboard-data');
const { getWeekOutputFilePath } = require('./teacher-dashboard-data');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getIsoMtimeIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.statSync(filePath).mtime.toISOString();
}

function pickLatestIsoDate(values) {
  const filtered = values.filter(Boolean).sort();
  return filtered.length === 0 ? null : filtered[filtered.length - 1];
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

function buildExpectedWeekFiles(context, outputRoot) {
  const definitions = [
    ['dashboard_html', 'แดชบอร์ดประจำสัปดาห์', 'dashboard.html'],
    ['week_bundle_html', 'หน้าเรียนประจำสัปดาห์', 'week-bundle.html'],
    ['cqi_report_markdown', 'รายงาน CQI', 'cqi-report.md'],
    ['workflow_summary_markdown', 'สรุป workflow', 'workflow-summary.md']
  ];

  return definitions.map(([id, label, fileName]) => {
    const absolutePath = getWeekOutputFilePath(context, fileName, outputRoot);

    return {
      id,
      label,
      file_name: fileName,
      absolute_path: absolutePath,
      relative_path: `./${path.relative(outputRoot, absolutePath).split(path.sep).join('/')}`,
      exists: fs.existsSync(absolutePath),
      last_updated_at: getIsoMtimeIfExists(absolutePath)
    };
  });
}

function summarizeRegistryWeeks(weeks) {
  const completeWeeks = weeks.filter((item) => item.status === 'complete');
  const partialWeeks = weeks.filter((item) => item.status === 'partial');
  const missingWeeks = weeks.filter((item) => item.status === 'missing');
  const expectedOutputFiles = weeks.reduce((total, item) => total + item.total_output_count, 0);
  const availableOutputFiles = weeks.reduce((total, item) => total + item.available_output_count, 0);

  return {
    total_weeks: weeks.length,
    complete_week_count: completeWeeks.length,
    partial_week_count: partialWeeks.length,
    missing_week_count: missingWeeks.length,
    available_output_file_count: availableOutputFiles,
    expected_output_file_count: expectedOutputFiles,
    completion_percent: expectedOutputFiles === 0 ? 0 : roundToTwoDecimals((availableOutputFiles / expectedOutputFiles) * 100),
    latest_generated_at: pickLatestIsoDate(weeks.map((item) => item.latest_generated_at)),
    latest_updated_at: pickLatestIsoDate(weeks.map((item) => item.latest_updated_at))
  };
}

function buildCourseOutputRegistry({
  coursePath,
  weeklyPlanPath,
  outputRoot = DEFAULT_OUTPUT_ROOT
}) {
  const resolvedCoursePath = path.resolve(process.cwd(), coursePath);
  const resolvedWeeklyPlanPath = path.resolve(process.cwd(), weeklyPlanPath);
  const course = readYaml(resolvedCoursePath);
  const weeklyPlan = readYaml(resolvedWeeklyPlanPath);
  const courseRoot = course.course || {};
  const weeklyUnits = weeklyPlan?.weekly_plan?.weekly_units || [];
  const courseId = courseRoot.course_id;

  const weeks = weeklyUnits
    .map((unit) => {
      const week = Number(unit.week);
      if (!Number.isInteger(week) || week <= 0) {
        return null;
      }

      const context = {
        course_id: courseId,
        module_id: `${courseId}_w${String(week).padStart(2, '0')}`,
        week
      };
      const workflowSummaryPath = getWeekOutputFilePath(context, 'workflow-summary.json', outputRoot);
      const workflowSummary = readJsonIfExists(workflowSummaryPath);
      const files = buildExpectedWeekFiles(context, outputRoot);
      const availableFiles = files.filter((item) => item.exists);
      let status = 'missing';

      if (availableFiles.length === files.length) {
        status = 'complete';
      } else if (availableFiles.length > 0) {
        status = 'partial';
      }

      return {
        week,
        title: unit.title || `Week ${week}`,
        module_id: context.module_id,
        status,
        available_output_count: availableFiles.length,
        total_output_count: files.length,
        latest_generated_at: workflowSummary?.generated_at || null,
        latest_updated_at: pickLatestIsoDate(files.map((item) => item.last_updated_at)),
        files
      };
    })
    .filter(Boolean);

  return {
    registry_type: 'course_output_registry_v1',
    generated_at: new Date().toISOString(),
    context: {
      course_id: courseId,
      course_code: courseRoot.course_code,
      course_title_th: courseRoot.course_title_th,
      course_title_en: courseRoot.course_title_en,
      total_weeks: weeks.length
    },
    overview: summarizeRegistryWeeks(weeks),
    weeks
  };
}

function getCourseOutputRegistryFilePath(courseId, outputRoot = DEFAULT_OUTPUT_ROOT) {
  return getCourseOutputFilePath(courseId, 'course-output-registry.json', outputRoot);
}

module.exports = {
  buildCourseOutputRegistry,
  getCourseOutputRegistryFilePath
};
