'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { DEFAULT_OUTPUT_ROOT, getCourseOutputFilePath } = require('./course-dashboard-data');
const { getCatalogOutputFilePath } = require('./catalog-dashboard-data');
const { getCourseBuildHistoryFilePath, loadCourseBuildHistory } = require('./build-history');
const { buildCourseActionQueue, getCourseActionQueueFilePath } = require('./course-action-queue');
const { getControlStatusSummaryFilePath } = require('./control-status-summary');
const { buildCourseOutputRegistry, getCourseOutputRegistryFilePath } = require('./output-registry');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildPreset(coursePath, weeklyPlanPath, id, title, description, weeks) {
  const weeksCsv = weeks.join(',');

  return {
    preset_id: id,
    title,
    description,
    weeks,
    command: `node tools/run-demo-course-workflow.js ${coursePath} ${weeklyPlanPath} ${weeksCsv}`
  };
}

function buildOutputHealth(registry) {
  const completedWeeks = registry.weeks.filter((item) => item.status === 'complete');
  const missingWeeks = registry.weeks
    .filter((item) => item.status !== 'complete')
    .map((item) => ({
      week: item.week,
      module_id: item.module_id,
      missing_files: item.files.filter((fileItem) => !fileItem.exists).map((fileItem) => fileItem.file_name)
    }));

  return {
    completed_week_count: completedWeeks.length,
    completed_weeks: completedWeeks.map((item) => item.week),
    partial_week_count: registry.overview.partial_week_count,
    missing_week_count: missingWeeks.length,
    missing_weeks: missingWeeks
  };
}

function buildWeekDirectory(registry) {
  return registry.weeks.map((item) => ({
    week: item.week,
    title: item.title,
    module_id: item.module_id,
    status: item.status,
    latest_generated_at: item.latest_generated_at,
    latest_updated_at: item.latest_updated_at,
    available_file_count: item.available_output_count,
    total_file_count: item.total_output_count,
    files: item.files
  }));
}

function buildInstructorBuildControlData({
  coursePath,
  weeklyPlanPath,
  outputRoot = DEFAULT_OUTPUT_ROOT,
  outputRegistry
}) {
  const resolvedCoursePath = path.resolve(process.cwd(), coursePath);
  const resolvedWeeklyPlanPath = path.resolve(process.cwd(), weeklyPlanPath);
  const course = readYaml(resolvedCoursePath);
  const courseRoot = course.course || {};
  const courseId = courseRoot.course_id;
  const registry = outputRegistry || buildCourseOutputRegistry({
    coursePath: resolvedCoursePath,
    weeklyPlanPath: resolvedWeeklyPlanPath,
    outputRoot
  });
  const weekNumbers = registry.weeks.map((item) => item.week);
  const starterWeeks = weekNumbers.slice(0, 3);
  const sampleWeek = weekNumbers.includes(3) ? [3] : weekNumbers.slice(0, 1);

  const lastCourseRun = readJsonIfExists(getCourseOutputFilePath(courseId, 'course-workflow-summary.json', outputRoot));
  const courseDashboardData = readJsonIfExists(getCourseOutputFilePath(courseId, 'course-dashboard-data.json', outputRoot));
  const catalogDashboardData = readJsonIfExists(getCatalogOutputFilePath('catalog-dashboard-data.json', outputRoot));
  const buildHistory = loadCourseBuildHistory(courseId, { outputRoot });
  const actionQueue = buildCourseActionQueue({
    coursePath: resolvedCoursePath,
    weeklyPlanPath: resolvedWeeklyPlanPath,
    outputRoot,
    outputRegistry: registry,
    buildHistory
  });
  const outputHealth = buildOutputHealth(registry);
  const weekDirectory = buildWeekDirectory(registry);

  return {
    control_type: 'instructor_build_control_v1',
    context: {
      course_id: courseId,
      course_code: courseRoot.course_code,
      course_title_th: courseRoot.course_title_th,
      course_title_en: courseRoot.course_title_en,
      total_weeks: weekNumbers.length
    },
    presets: [
      buildPreset(coursePath, weeklyPlanPath, 'single_sample_week', 'สร้างสัปดาห์ตัวอย่าง', 'เหมาะสำหรับตรวจ flow เร็ว ๆ ด้วยสัปดาห์ตัวอย่างเดียว', sampleWeek),
      buildPreset(coursePath, weeklyPlanPath, 'starter_course', 'สร้างชุดเริ่มต้น 3 สัปดาห์', 'เหมาะสำหรับสร้างตัวอย่างรายวิชาแบบย่อที่ดูภาพรวมได้เร็ว', starterWeeks),
      buildPreset(coursePath, weeklyPlanPath, 'full_course', 'สร้างทั้งรายวิชา', 'เหมาะสำหรับ refresh output ทั้งรายวิชาตาม weekly plan ปัจจุบัน', weekNumbers)
    ],
    latest_run: lastCourseRun
      ? {
          workflow_type: lastCourseRun.workflow_type,
          generated_week_count: lastCourseRun.generated_week_count,
          generated_weeks: lastCourseRun.generated_weeks,
          files: lastCourseRun.files
        }
      : null,
    current_outputs: {
      course_dashboard_data_json: getCourseOutputFilePath(courseId, 'course-dashboard-data.json', outputRoot),
      course_dashboard_html: getCourseOutputFilePath(courseId, 'course-dashboard.html', outputRoot),
      catalog_dashboard_data_json: getCatalogOutputFilePath('catalog-dashboard-data.json', outputRoot),
      catalog_dashboard_html: getCatalogOutputFilePath('catalog-dashboard.html', outputRoot),
      control_status_summary_json: getControlStatusSummaryFilePath(outputRoot),
      build_history_json: getCourseBuildHistoryFilePath(courseId, outputRoot),
      course_output_registry_json: getCourseOutputRegistryFilePath(courseId, outputRoot),
      course_action_queue_json: getCourseActionQueueFilePath(courseId, outputRoot),
      course_workflow_summary_json: getCourseOutputFilePath(courseId, 'course-workflow-summary.json', outputRoot),
      course_workflow_summary_markdown: getCourseOutputFilePath(courseId, 'course-workflow-summary.md', outputRoot)
    },
    recent_runs: buildHistory.runs.slice(0, 5),
    recommended_actions: actionQueue.actions,
    output_health: outputHealth,
    week_directory: weekDirectory,
    output_registry_overview: registry.overview,
    output_snapshots: {
      course_dashboard_overview: courseDashboardData?.overview || null,
      catalog_dashboard_overview: catalogDashboardData?.overview || null
    }
  };
}

function getInstructorControlOutputFilePath(fileName, outputRoot = DEFAULT_OUTPUT_ROOT) {
  return path.join(outputRoot, fileName);
}

module.exports = {
  buildInstructorBuildControlData,
  getInstructorControlOutputFilePath
};
