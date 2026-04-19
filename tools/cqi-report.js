'use strict';

const {
  buildCqiSignals,
  createAnalyticsEvents,
  summarizeCloEvents
} = require('./analytics');

function countByEventType(events, eventType) {
  return (events || []).filter((event) => event.event_type === eventType).length;
}

function buildOverview(reportContext, events, cloReports) {
  const attainedClos = cloReports.filter((report) => report.attained === true).length;
  const actionNeededClos = cloReports.filter((report) => report.status === 'action_needed').length;

  return {
    generated_at: reportContext.generated_at,
    course_id: reportContext.course_id,
    module_id: reportContext.module_id,
    week: reportContext.week,
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

function buildCqiReport({ course, bundle, runtimeState, assessmentResults = [], reflections = [], generatedAt = null }) {
  if (!course?.course) {
    throw new Error('course payload is required.');
  }
  if (!bundle?.interactive_module) {
    throw new Error('bundle payload is required.');
  }
  if (!runtimeState?.runtime_state) {
    throw new Error('runtimeState payload is required.');
  }

  const events = createAnalyticsEvents({
    bundle,
    runtimeState,
    assessmentResults,
    reflections
  });
  const cloSummaries = summarizeCloEvents(course, events);
  const cqiSignals = buildCqiSignals(cloSummaries);
  const reportContext = {
    generated_at: generatedAt || runtimeState.runtime_state.updated_at || null,
    course_id: bundle.interactive_module.course_id,
    module_id: bundle.interactive_module.module_id,
    week: bundle.interactive_module.week
  };
  const cloReports = buildCloReports(cloSummaries, cqiSignals);

  return {
    report_type: 'cqi_summary_v1',
    context: reportContext,
    overview: buildOverview(reportContext, events, cloReports),
    clo_reports: cloReports,
    source_events: events
  };
}

function formatPercent(value) {
  return value === null || value === undefined ? 'n/a' : `${value}%`;
}

function renderCqiReportMarkdown(report) {
  const lines = [
    '# CQI Summary Report',
    '',
    `- Course: ${report.context.course_id}`,
    `- Module: ${report.context.module_id}`,
    `- Week: ${report.context.week}`,
    `- Generated at: ${report.context.generated_at || 'n/a'}`,
    '',
    '## Overview',
    '',
    `- Total CLOs reviewed: ${report.overview.total_clos}`,
    `- CLOs attained: ${report.overview.attained_clos}`,
    `- Attainment rate: ${formatPercent(report.overview.attainment_rate_percent)}`,
    `- CLOs requiring action: ${report.overview.clos_requiring_action}`,
    `- Completion evidence events: ${report.overview.completion_event_count}`,
    `- Score evidence events: ${report.overview.score_event_count}`,
    `- Reflection evidence events: ${report.overview.reflection_event_count}`,
    '',
    '## CLO Detail',
    ''
  ];

  report.clo_reports.forEach((cloReport) => {
    lines.push(`### ${cloReport.clo_id}`);
    lines.push('');
    lines.push(`- Status: ${cloReport.status}`);
    lines.push(`- Average score: ${formatPercent(cloReport.average_score_percent)}`);
    lines.push(`- Pass threshold: ${formatPercent(cloReport.pass_threshold_percent)}`);
    lines.push(`- Attained: ${cloReport.attained === null ? 'n/a' : String(cloReport.attained)}`);
    lines.push(`- Completion events: ${cloReport.completion_event_count}`);
    lines.push(`- Score events: ${cloReport.score_event_count}`);
    lines.push(`- Reflection events: ${cloReport.reflection_event_count}`);
    lines.push(`- Issues: ${cloReport.issues.length === 0 ? 'none' : cloReport.issues.join(', ')}`);
    lines.push(`- Related sources: ${cloReport.related_source_ids.length === 0 ? 'none' : cloReport.related_source_ids.join(', ')}`);
    lines.push(`- Recommended action: ${cloReport.recommended_action}`);
    lines.push('');
  });

  return lines.join('\n');
}

module.exports = {
  buildCloReports,
  buildCqiReport,
  renderCqiReportMarkdown
};
