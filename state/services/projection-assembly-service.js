'use strict';

const { LearningRecordQueryService } = require('./learning-record-query-service');
const { buildCqiProjectionInput } = require('../projections/cqi-projection');
const { buildTeacherWeekProjectionInput } = require('../projections/teacher-week-projection');
const { buildCourseProjectionInput } = require('../projections/course-projection');

class ProjectionAssemblyService {
  constructor({ learningRecordQueryService }) {
    if (!(learningRecordQueryService instanceof LearningRecordQueryService)) {
      throw new Error('ProjectionAssemblyService requires a LearningRecordQueryService instance.');
    }

    this.learningRecordQueryService = learningRecordQueryService;
  }

  buildTeacherWeekProjection({ identity, course, bundle }) {
    const projectionInputs = this.learningRecordQueryService.getProjectionInputs(identity);
    const cqiProjection = buildCqiProjectionInput({
      course,
      projectionInputs
    });

    return buildTeacherWeekProjectionInput({
      bundle,
      projectionInputs,
      cqiProjection
    });
  }

  buildCourseProjection({ course, weeks }) {
    const weekProjections = (weeks || []).map((item) =>
      this.buildTeacherWeekProjection({
        identity: item.identity,
        course,
        bundle: item.bundle
      })
    );

    return buildCourseProjectionInput({
      course,
      weekProjections
    });
  }

  buildCqiProjection({ identity, course }) {
    return buildCqiProjectionInput({
      course,
      projectionInputs: this.learningRecordQueryService.getProjectionInputs(identity)
    });
  }
}

module.exports = {
  ProjectionAssemblyService
};
