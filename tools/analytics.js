'use strict';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function unique(values) {
  return [...new Set(values)];
}

function activityMapFromBundle(bundle) {
  return new Map((bundle?.interactive_module?.activities || []).map((activity) => [activity.activity_id, activity]));
}

function buildCloIndex(course) {
  return new Map((course?.course?.cilos || []).map((clo) => [clo.clo_id, clo]));
}

function getRequiredModule(bundle) {
  if (!bundle?.interactive_module) {
    throw new Error('bundle.interactive_module is required.');
  }
  return bundle.interactive_module;
}

function getRequiredRuntimeState(runtimeState) {
  if (!runtimeState?.runtime_state) {
    throw new Error('runtime_state payload is required.');
  }
  return runtimeState.runtime_state;
}

function toCloIds(cloMapping) {
  if (!cloMapping) {
    return [];
  }
  return unique([cloMapping.primary, ...(cloMapping.secondary || [])].filter(Boolean));
}

function createCompletionEvents(bundle, runtimeState) {
  const moduleRoot = getRequiredModule(bundle);
  const runtimeRoot = getRequiredRuntimeState(runtimeState);
  const activityById = activityMapFromBundle(bundle);
  const sectionById = new Map((moduleRoot.learning_flow || []).map((section) => [section.section_id, section]));
  const events = [];

  runtimeRoot.sections
    .filter((section) => section.status === 'completed')
    .forEach((section) => {
      const moduleSection = sectionById.get(section.section_id);
      const cloIds = unique(
        (moduleSection?.activity_refs || [])
          .map((activityId) => activityById.get(activityId))
          .filter(Boolean)
          .flatMap((activity) => toCloIds(activity.clo_mapping))
      );

      events.push({
        event_type: 'completion',
        source_type: 'section',
        source_id: section.section_id,
        module_id: moduleRoot.module_id,
        course_id: moduleRoot.course_id,
        week: moduleRoot.week,
        clo_ids: cloIds,
        timestamp: section.completed_at || runtimeRoot.updated_at,
        completion_status: section.status,
        evidence_type: 'completion'
      });
    });

  runtimeRoot.activities
    .filter((activity) => activity.status === 'completed')
    .forEach((activity) => {
      const moduleActivity = activityById.get(activity.activity_id);

      events.push({
        event_type: 'completion',
        source_type: 'activity',
        source_id: activity.activity_id,
        module_id: moduleRoot.module_id,
        course_id: moduleRoot.course_id,
        week: moduleRoot.week,
        clo_ids: toCloIds(moduleActivity?.clo_mapping),
        timestamp: activity.completed_at || runtimeRoot.updated_at,
        completion_status: activity.status,
        evidence_type: 'completion'
      });
    });

  return events;
}

function createAssessmentEvents(bundle, assessmentResults, options = {}) {
  const moduleRoot = getRequiredModule(bundle);
  const timestamp = options.timestamp || null;

  return (assessmentResults || []).map((result) => ({
    event_type: 'score',
    source_type: result.activity_type,
    source_id: result.activity_id,
    module_id: moduleRoot.module_id,
    course_id: moduleRoot.course_id,
    week: moduleRoot.week,
    clo_ids: toCloIds(result.clo_mapping),
    timestamp: result.scored_at || timestamp,
    score_percent: result.score_percent,
    score_ratio: result.score_ratio,
    passed: result.passed,
    assessment_links: clone(result.assessment_links || []),
    evidence_tags: clone(result.evidence_tags || []),
    evidence_type: 'score'
  }));
}

function createReflectionEvents(bundle, reflections = []) {
  const moduleRoot = getRequiredModule(bundle);
  const activityById = activityMapFromBundle(bundle);

  return reflections.map((reflection, index) => {
    const activity = reflection.activity_id ? activityById.get(reflection.activity_id) : null;
    const fallbackId = `reflection_${String(index + 1).padStart(2, '0')}`;

    return {
      event_type: 'reflection',
      source_type: 'reflection',
      source_id: reflection.activity_id || fallbackId,
      module_id: moduleRoot.module_id,
      course_id: moduleRoot.course_id,
      week: moduleRoot.week,
      clo_ids: reflection.clo_ids || toCloIds(activity?.clo_mapping),
      timestamp: reflection.timestamp || null,
      reflection_text: reflection.text,
      evidence_tags: clone(reflection.evidence_tags || []),
      evidence_type: 'reflection'
    };
  });
}

function createAnalyticsEvents({ bundle, runtimeState, assessmentResults = [], reflections = [] }) {
  return [
    ...createCompletionEvents(bundle, runtimeState),
    ...createAssessmentEvents(bundle, assessmentResults),
    ...createReflectionEvents(bundle, reflections)
  ];
}

function summarizeCloEvents(course, events) {
  const cloIndex = buildCloIndex(course);
  const summaries = [];

  cloIndex.forEach((clo, cloId) => {
    const cloEvents = (events || []).filter((event) => (event.clo_ids || []).includes(cloId));
    const completionEvents = cloEvents.filter((event) => event.event_type === 'completion' && event.source_type === 'activity');
    const scoreEvents = cloEvents.filter((event) => event.event_type === 'score');
    const reflectionEvents = cloEvents.filter((event) => event.event_type === 'reflection');
    const averageScorePercent = scoreEvents.length === 0
      ? null
      : Math.round((scoreEvents.reduce((sum, event) => sum + Number(event.score_percent || 0), 0) / scoreEvents.length) * 100) / 100;
    const passThresholdPercent = Number(clo.passing_criteria?.min_score_percent ?? 0);
    const attained = averageScorePercent === null ? null : averageScorePercent >= passThresholdPercent;

    summaries.push({
      clo_id: cloId,
      statement: clo.statement,
      pass_threshold_percent: passThresholdPercent,
      completion_event_count: completionEvents.length,
      score_event_count: scoreEvents.length,
      reflection_event_count: reflectionEvents.length,
      average_score_percent: averageScorePercent,
      passed_score_event_count: scoreEvents.filter((event) => event.passed).length,
      attained,
      evidence_types_seen: unique(cloEvents.map((event) => event.evidence_type)),
      related_source_ids: unique(cloEvents.map((event) => event.source_id)),
      evidence_tags_seen: unique(cloEvents.flatMap((event) => event.evidence_tags || []))
    });
  });

  return summaries;
}

function buildCqiSignals(cloSummaries) {
  return cloSummaries.map((summary) => {
    const issues = [];

    if (summary.score_event_count === 0) {
      issues.push('missing_direct_score_evidence');
    } else if (summary.attained === false) {
      issues.push('below_pass_threshold');
    }

    if (summary.completion_event_count === 0) {
      issues.push('missing_completion_evidence');
    }

    if (summary.reflection_event_count === 0) {
      issues.push('missing_reflection_evidence');
    }

    return {
      clo_id: summary.clo_id,
      status: issues.length === 0 ? 'monitor' : 'action_needed',
      issues,
      recommended_action: issues.length === 0
        ? 'Continue monitoring current teaching and evidence pattern.'
        : `Review teaching strategy, assessment evidence, and weekly support for ${summary.clo_id}.`
    };
  });
}

module.exports = {
  buildCqiSignals,
  createAnalyticsEvents,
  createAssessmentEvents,
  createCompletionEvents,
  createReflectionEvents,
  summarizeCloEvents
};
