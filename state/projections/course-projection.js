'use strict';

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

function summarizeCourseWeekProjections(weekProjections) {
  if (weekProjections.length === 0) {
    return {
      indexed_weeks: 0,
      completed_weeks: 0,
      average_progress_percent: 0,
      total_clos: 0,
      attained_clos: 0,
      average_attainment_rate_percent: 0,
      clos_requiring_action: 0,
      total_assessment_results: 0,
      total_analytics_events: 0
    };
  }

  const totals = weekProjections.reduce((accumulator, projection) => {
    accumulator.completed_weeks += projection.runtime_summary.status === 'completed' ? 1 : 0;
    accumulator.progress_percent += Number(projection.runtime_summary.progress_percent || 0);
    accumulator.total_clos += Number(projection.cqi_summary.total_clos || 0);
    accumulator.attained_clos += Number(projection.cqi_summary.attained_clos || 0);
    accumulator.attainment_rate_percent += Number(projection.cqi_summary.attainment_rate_percent || 0);
    accumulator.clos_requiring_action += Number(projection.cqi_summary.clos_requiring_action || 0);
    accumulator.total_assessment_results += Number(projection.canonical_counts.assessment_result_records || 0);
    accumulator.total_analytics_events += Number(projection.canonical_counts.analytics_event_records || 0);
    return accumulator;
  }, {
    completed_weeks: 0,
    progress_percent: 0,
    total_clos: 0,
    attained_clos: 0,
    attainment_rate_percent: 0,
    clos_requiring_action: 0,
    total_assessment_results: 0,
    total_analytics_events: 0
  });

  return {
    indexed_weeks: weekProjections.length,
    completed_weeks: totals.completed_weeks,
    average_progress_percent: roundToTwoDecimals(totals.progress_percent / weekProjections.length),
    total_clos: totals.total_clos,
    attained_clos: totals.attained_clos,
    average_attainment_rate_percent: roundToTwoDecimals(totals.attainment_rate_percent / weekProjections.length),
    clos_requiring_action: totals.clos_requiring_action,
    total_assessment_results: totals.total_assessment_results,
    total_analytics_events: totals.total_analytics_events
  };
}

function buildCourseProjectionInput({ course, weekProjections }) {
  if (!course?.course?.course_id) {
    throw new Error('course.course.course_id is required.');
  }
  if (!Array.isArray(weekProjections)) {
    throw new Error('weekProjections must be an array.');
  }

  const normalizedWeeks = [...weekProjections].sort((left, right) => {
    return left.context.week - right.context.week
      || String(left.context.module_id).localeCompare(String(right.context.module_id));
  });

  return {
    projection_type: 'teacher_course_projection_v1',
    context: {
      course_id: course.course.course_id,
      learner_key: normalizedWeeks[0]?.context?.learner_key || null
    },
    overview: summarizeCourseWeekProjections(normalizedWeeks),
    weeks: normalizedWeeks
  };
}

module.exports = {
  buildCourseProjectionInput,
  summarizeCourseWeekProjections
};
