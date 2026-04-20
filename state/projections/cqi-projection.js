'use strict';

const { summarizeCloEvents, buildCqiSignals } = require('../../tools/analytics');

function countByEventType(events, eventType) {
  return (events || []).filter((event) => event.event_type === eventType).length;
}

function buildOverview(context, events, cloReports) {
  const attainedClos = cloReports.filter((report) => report.attained === true).length;
  const actionNeededClos = cloReports.filter((report) => report.status === 'action_needed').length;

  return {
    course_id: context.course_id,
    module_id: context.module_id,
    week: context.week,
    learner_key: context.learner_key,
    total_clos: cloReports.length,
    attained_clos: attainedClos,
    attainment_rate_percent: cloReports.length === 0 ? 0 : Math.round((attainedClos / cloReports.length) * 10000) / 100,
    clos_requiring_action: actionNeededClos,
    completion_event_count: countByEventType(events, 'completion'),
    score_event_count: countByEventType(events, 'score'),
    reflection_event_count: countByEventType(events, 'reflection')
  };
}

function buildCloReports(cloSummaries, cqiSignals) {
  const signalByCloId = new Map((cqiSignals || []).map((signal) => [signal.clo_id, signal]));

  return cloSummaries.map((summary) => {
    const signal = signalByCloId.get(summary.clo_id) || {
      status: 'monitor',
      issues: [],
      recommended_action: 'Continue monitoring current teaching and evidence pattern.'
    };

    return {
      clo_id: summary.clo_id,
      statement: summary.statement,
      pass_threshold_percent: summary.pass_threshold_percent,
      average_score_percent: summary.average_score_percent,
      attained: summary.attained,
      completion_event_count: summary.completion_event_count,
      score_event_count: summary.score_event_count,
      reflection_event_count: summary.reflection_event_count,
      evidence_types_seen: summary.evidence_types_seen,
      evidence_tags_seen: summary.evidence_tags_seen,
      related_source_ids: summary.related_source_ids,
      status: signal.status,
      issues: signal.issues,
      recommended_action: signal.recommended_action
    };
  });
}

function buildCqiProjectionInput({ course, projectionInputs }) {
  if (!course?.course) {
    throw new Error('course payload is required.');
  }
  if (!projectionInputs?.context) {
    throw new Error('projectionInputs.context is required.');
  }

  const events = projectionInputs.analytics_event_records || [];
  const cloSummaries = summarizeCloEvents(course, events);
  const cqiSignals = buildCqiSignals(cloSummaries);
  const cloReports = buildCloReports(cloSummaries, cqiSignals);

  return {
    projection_type: 'cqi_projection_v1',
    context: projectionInputs.context,
    overview: buildOverview(projectionInputs.context, events, cloReports),
    clo_reports: cloReports,
    source_counts: {
      attempt_records: (projectionInputs.attempt_records || []).length,
      assessment_result_records: (projectionInputs.assessment_result_records || []).length,
      analytics_event_records: events.length
    }
  };
}

module.exports = {
  buildCqiProjectionInput
};
