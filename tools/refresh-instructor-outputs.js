'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildInstructorBuildControlData, getInstructorControlOutputFilePath } = require('./instructor-build-control-data');
const { buildCourseOutputRegistry, getCourseOutputRegistryFilePath } = require('./output-registry');
const { renderInstructorBuildControlPage } = require('../frontend/instructor-build-control-view');

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

function refreshInstructorOutputs({
  coursePath,
  weeklyPlanPath,
  outputRoot
}) {
  const registry = buildCourseOutputRegistry({
    coursePath,
    weeklyPlanPath,
    outputRoot
  });
  const registryPath = getCourseOutputRegistryFilePath(registry.context.course_id, outputRoot);
  writeJsonFile(registryPath, registry);

  const buildControlData = buildInstructorBuildControlData({
    coursePath,
    weeklyPlanPath,
    outputRoot,
    outputRegistry: registry
  });
  const buildControlDataPath = getInstructorControlOutputFilePath('build-control-data.json', outputRoot);
  const buildControlHtmlPath = getInstructorControlOutputFilePath('build-control.html', outputRoot);
  writeJsonFile(buildControlDataPath, buildControlData);
  writeTextFile(buildControlHtmlPath, renderInstructorBuildControlPage(buildControlData));

  return {
    registry,
    build_control_data: buildControlData,
    files: {
      course_output_registry_json: registryPath,
      build_control_data_json: buildControlDataPath,
      build_control_html: buildControlHtmlPath
    }
  };
}

module.exports = {
  refreshInstructorOutputs
};
