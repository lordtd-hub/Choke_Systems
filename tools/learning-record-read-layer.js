'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { createFileBackedLearningRecordStore } = require('../state/repositories/file-backed-learning-record-store');
const { LearningRecordQueryService } = require('../state/services/learning-record-query-service');
const { ProjectionAssemblyService } = require('../state/services/projection-assembly-service');

const DEFAULT_COURSE_PATH = path.join(process.cwd(), 'calculus1_course.yaml');
const DEFAULT_LEARNER_KEY = 'demo_learner';

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveCoursePath(coursePath = DEFAULT_COURSE_PATH) {
  return path.resolve(process.cwd(), coursePath);
}

function loadCourseDefinition(options = {}) {
  const resolvedCoursePath = resolveCoursePath(options.coursePath);

  return {
    course: readYaml(resolvedCoursePath),
    course_path: resolvedCoursePath
  };
}

function buildLearningRecordIdentity(context, learnerKey = DEFAULT_LEARNER_KEY) {
  return {
    learner_key: learnerKey,
    course_id: context.course_id || context.courseId,
    module_id: context.module_id || context.moduleId,
    week: Number(context.week)
  };
}

function createLearningRecordProjectionServices(options = {}) {
  const store = createFileBackedLearningRecordStore({
    storageRoot: options.storageRoot
  });
  const learningRecordQueryService = new LearningRecordQueryService({
    learnerModuleStateRepository: store.learnerModuleStates,
    attemptRecordRepository: store.attempts,
    assessmentResultRepository: store.assessmentResults,
    analyticsEventRepository: store.analyticsEvents
  });
  const projectionAssemblyService = new ProjectionAssemblyService({
    learningRecordQueryService
  });

  return {
    store,
    learningRecordQueryService,
    projectionAssemblyService
  };
}

module.exports = {
  DEFAULT_COURSE_PATH,
  DEFAULT_LEARNER_KEY,
  buildLearningRecordIdentity,
  createLearningRecordProjectionServices,
  loadCourseDefinition,
  readYaml,
  resolveCoursePath
};
