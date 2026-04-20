'use strict';

function summarizeAssessmentEvidence(projectionInputs) {
  const results = projectionInputs.assessment_result_records || [];
  const passedResults = results.filter((result) => result.passed).length;
  const attemptedActivities = new Set((projectionInputs.attempt_records || []).map((attempt) => attempt.activity_id));
  const scoredActivities = new Set(results.map((result) => result.activity_id));

  return {
    attempt_record_count: (projectionInputs.attempt_records || []).length,
    assessment_result_count: results.length,
    passed_assessment_result_count: passedResults,
    attempted_activity_count: attemptedActivities.size,
    scored_activity_count: scoredActivities.size
  };
}

function summarizeAnalytics(projectionInputs) {
  const events = projectionInputs.analytics_event_records || [];

  return {
    total_events: events.length,
    completion_event_count: events.filter((event) => event.event_type === 'completion').length,
    score_event_count: events.filter((event) => event.event_type === 'score').length,
    reflection_event_count: events.filter((event) => event.event_type === 'reflection').length
  };
}

function buildTeacherWeekProjectionInput({ bundle, projectionInputs, cqiProjection }) {
  if (!bundle?.interactive_module) {
    throw new Error('bundle.interactive_module is required.');
  }
  if (!projectionInputs?.learner_module_state) {
    throw new Error('projectionInputs.learner_module_state is required.');
  }
  if (!cqiProjection?.overview) {
    throw new Error('cqiProjection.overview is required.');
  }

  const moduleRoot = bundle.interactive_module;
  const state = projectionInputs.learner_module_state;

  return {
    projection_type: 'teacher_week_projection_v1',
    context: projectionInputs.context,
    module: {
      title: moduleRoot.title,
      clo_focus: moduleRoot.clo_focus,
      section_count: (moduleRoot.learning_flow || []).length,
      activity_count: (moduleRoot.activities || []).length,
      supplementary_material_count: (bundle.supplementary_materials || []).length,
      sbra_payload_count: (bundle.sbra_payloads || []).length
    },
    runtime_summary: {
      status: state.status,
      progress_percent: state.progress.progress_percent,
      required_sections_total: state.progress.required_sections_total,
      required_sections_completed: state.progress.required_sections_completed,
      required_activities_total: state.progress.required_activities_total,
      required_activities_completed: state.progress.required_activities_completed
    },
    assessment_summary: summarizeAssessmentEvidence(projectionInputs),
    analytics_summary: summarizeAnalytics(projectionInputs),
    cqi_summary: {
      total_clos: cqiProjection.overview.total_clos,
      attained_clos: cqiProjection.overview.attained_clos,
      attainment_rate_percent: cqiProjection.overview.attainment_rate_percent,
      clos_requiring_action: cqiProjection.overview.clos_requiring_action
    },
    canonical_counts: {
      learner_module_state: state ? 1 : 0,
      attempt_records: (projectionInputs.attempt_records || []).length,
      assessment_result_records: (projectionInputs.assessment_result_records || []).length,
      analytics_event_records: (projectionInputs.analytics_event_records || []).length
    }
  };
}

module.exports = {
  buildTeacherWeekProjectionInput
};
