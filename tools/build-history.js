'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DEFAULT_OUTPUT_ROOT, getCourseOutputFilePath } = require('./course-dashboard-data');

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonFile(filePath, payload) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function getCourseBuildHistoryFilePath(courseId, outputRoot = DEFAULT_OUTPUT_ROOT) {
  return getCourseOutputFilePath(courseId, 'build-history.json', outputRoot);
}

function appendCourseBuildHistory(courseId, entry, options = {}) {
  const outputRoot = options.outputRoot || DEFAULT_OUTPUT_ROOT;
  const filePath = getCourseBuildHistoryFilePath(courseId, outputRoot);
  const history = readJsonIfExists(filePath, {
    history_type: 'course_build_history_v1',
    course_id: courseId,
    runs: []
  });

  history.runs.unshift(entry);
  history.runs = history.runs.slice(0, options.limit || 20);

  writeJsonFile(filePath, history);
  return history;
}

function loadCourseBuildHistory(courseId, options = {}) {
  const outputRoot = options.outputRoot || DEFAULT_OUTPUT_ROOT;
  return readJsonIfExists(getCourseBuildHistoryFilePath(courseId, outputRoot), {
    history_type: 'course_build_history_v1',
    course_id: courseId,
    runs: []
  });
}

module.exports = {
  appendCourseBuildHistory,
  getCourseBuildHistoryFilePath,
  loadCourseBuildHistory
};
