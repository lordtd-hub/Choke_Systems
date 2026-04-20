'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DEFAULT_OUTPUT_ROOT, getCourseOutputFilePath } = require('./course-dashboard-data');

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

function describeFile(filePath, outputRoot, label) {
  return {
    label,
    absolute_path: filePath,
    relative_path: `./${path.relative(outputRoot, filePath).split(path.sep).join('/')}`,
    exists: fs.existsSync(filePath),
    last_updated_at: getIsoMtimeIfExists(filePath)
  };
}

function listIndexedCourses(outputRoot) {
  if (!fs.existsSync(outputRoot)) {
    return [];
  }

  return fs.readdirSync(outputRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((courseId) => fs.existsSync(getCourseOutputFilePath(courseId, 'course-dashboard-data.json', outputRoot)))
    .sort();
}

function getCatalogOutputFilePath(fileName, outputRoot) {
  return path.join(outputRoot, fileName);
}

function buildSystemOutputRegistry(options = {}) {
  const outputRoot = options.outputRoot || DEFAULT_OUTPUT_ROOT;
  const courseIds = options.courseIds || listIndexedCourses(outputRoot);
  const topLevelFiles = [
    describeFile(getCatalogOutputFilePath('catalog-dashboard-data.json', outputRoot), outputRoot, 'ข้อมูลแคตตาล็อก JSON'),
    describeFile(getCatalogOutputFilePath('catalog-dashboard.html', outputRoot), outputRoot, 'หน้าแคตตาล็อกระบบ'),
    describeFile(path.join(outputRoot, 'build-control-data.json'), outputRoot, 'ข้อมูลศูนย์ควบคุม JSON'),
    describeFile(path.join(outputRoot, 'build-control.html'), outputRoot, 'หน้าศูนย์ควบคุมอาจารย์')
  ];

  const courses = courseIds.map((courseId) => {
    const courseDashboard = describeFile(getCourseOutputFilePath(courseId, 'course-dashboard.html', outputRoot), outputRoot, 'แดชบอร์ดรายวิชา');
    const courseData = describeFile(getCourseOutputFilePath(courseId, 'course-dashboard-data.json', outputRoot), outputRoot, 'ข้อมูลรายวิชา JSON');
    const outputRegistry = describeFile(getCourseOutputFilePath(courseId, 'course-output-registry.json', outputRoot), outputRoot, 'ทะเบียน output รายวิชา');
    const actionQueue = describeFile(getCourseOutputFilePath(courseId, 'course-action-queue.json', outputRoot), outputRoot, 'คิวงานถัดไปของรายวิชา');
    const buildHistory = describeFile(getCourseOutputFilePath(courseId, 'build-history.json', outputRoot), outputRoot, 'ประวัติการรันรายวิชา');
    const workflowSummary = describeFile(getCourseOutputFilePath(courseId, 'course-workflow-summary.md', outputRoot), outputRoot, 'สรุปการรันรายวิชา');
    const registryPayload = readJsonIfExists(outputRegistry.absolute_path);
    const dashboardPayload = readJsonIfExists(courseData.absolute_path);

    return {
      course_id: courseId,
      overview: dashboardPayload?.overview || null,
      output_overview: registryPayload?.overview || null,
      files: {
        course_dashboard_html: courseDashboard,
        course_dashboard_data_json: courseData,
        course_output_registry_json: outputRegistry,
        course_action_queue_json: actionQueue,
        build_history_json: buildHistory,
        course_workflow_summary_markdown: workflowSummary
      }
    };
  });

  return {
    registry_type: 'system_output_registry_v1',
    generated_at: new Date().toISOString(),
    top_level_files: topLevelFiles,
    courses
  };
}

function getSystemOutputRegistryFilePath(outputRoot = DEFAULT_OUTPUT_ROOT) {
  return path.join(outputRoot, 'system-output-registry.json');
}

module.exports = {
  buildSystemOutputRegistry,
  getSystemOutputRegistryFilePath
};
