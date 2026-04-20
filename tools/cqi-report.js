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
  return value === null || value === undefined ? 'ไม่มีข้อมูล' : `${value}%`;
}

function formatAttainment(value) {
  if (value === null || value === undefined) {
    return 'ไม่มีข้อมูล';
  }

  return value ? 'บรรลุ' : 'ยังไม่บรรลุ';
}

function formatStatus(value) {
  const labels = {
    monitor: 'ติดตามต่อเนื่อง',
    action_needed: 'ต้องติดตามและปรับปรุง'
  };

  return labels[value] || value || 'ไม่มีข้อมูล';
}

function formatIssue(value) {
  const labels = {
    missing_direct_score_evidence: 'ยังไม่มีหลักฐานคะแนนโดยตรง',
    below_pass_threshold: 'คะแนนเฉลี่ยต่ำกว่าเกณฑ์ผ่าน',
    missing_completion_evidence: 'ยังไม่มีหลักฐานการทำกิจกรรมสำเร็จ',
    missing_reflection_evidence: 'ยังไม่มีหลักฐานการสะท้อนคิด'
  };

  return labels[value] || value;
}

function formatRecommendedAction(cloId, status) {
  if (status === 'monitor') {
    return 'ติดตามรูปแบบการสอนและหลักฐานการเรียนรู้ต่อเนื่อง';
  }

  return `ทบทวนกลยุทธ์การสอน หลักฐานการประเมิน และการช่วยเหลือรายสัปดาห์สำหรับ ${cloId}`;
}

function renderCqiReportMarkdown(report) {
  const lines = [
    '# รายงานสรุป CQI',
    '',
    `- รายวิชา: ${report.context.course_id}`,
    `- โมดูล: ${report.context.module_id}`,
    `- สัปดาห์ที่: ${report.context.week}`,
    `- เวลาที่สร้างรายงาน: ${report.context.generated_at || 'ไม่มีข้อมูล'}`,
    '',
    '## ภาพรวม',
    '',
    `- จำนวน CLO ที่ทบทวน: ${report.overview.total_clos}`,
    `- จำนวน CLO ที่บรรลุ: ${report.overview.attained_clos}`,
    `- อัตราการบรรลุ: ${formatPercent(report.overview.attainment_rate_percent)}`,
    `- จำนวน CLO ที่ควรติดตามต่อ: ${report.overview.clos_requiring_action}`,
    `- จำนวนเหตุการณ์หลักฐานการเรียนรู้แบบสำเร็จ: ${report.overview.completion_event_count}`,
    `- จำนวนเหตุการณ์หลักฐานคะแนน: ${report.overview.score_event_count}`,
    `- จำนวนเหตุการณ์สะท้อนคิด: ${report.overview.reflection_event_count}`,
    '',
    '## รายละเอียดราย CLO',
    ''
  ];

  report.clo_reports.forEach((cloReport) => {
    lines.push(`### ${cloReport.clo_id}`);
    lines.push('');
    lines.push(`- สถานะ: ${formatStatus(cloReport.status)}`);
    lines.push(`- คะแนนเฉลี่ย: ${formatPercent(cloReport.average_score_percent)}`);
    lines.push(`- เกณฑ์ผ่าน: ${formatPercent(cloReport.pass_threshold_percent)}`);
    lines.push(`- ผลการบรรลุ: ${formatAttainment(cloReport.attained)}`);
    lines.push(`- จำนวนเหตุการณ์สำเร็จ: ${cloReport.completion_event_count}`);
    lines.push(`- จำนวนเหตุการณ์คะแนน: ${cloReport.score_event_count}`);
    lines.push(`- จำนวนเหตุการณ์สะท้อนคิด: ${cloReport.reflection_event_count}`);
    lines.push(`- ประเด็นที่พบ: ${cloReport.issues.length === 0 ? 'ไม่มี' : cloReport.issues.map((issue) => formatIssue(issue)).join(', ')}`);
    lines.push(`- แหล่งอ้างอิงที่เกี่ยวข้อง: ${cloReport.related_source_ids.length === 0 ? 'ไม่มี' : cloReport.related_source_ids.join(', ')}`);
    lines.push(`- ข้อเสนอแนะ: ${formatRecommendedAction(cloReport.clo_id, cloReport.status)}`);
    lines.push('');
  });

  return lines.join('\n');
}

module.exports = {
  buildCloReports,
  buildCqiReport,
  renderCqiReportMarkdown
};
