'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { createDemoCqiReport } = require('../tools/render-demo-cqi-report');
const { renderCqiReportMarkdown } = require('../tools/cqi-report');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const course = readYaml(path.join(__dirname, '..', 'calculus1_course.yaml'));
const weeklyPlan = readYaml(path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'));

{
  const report = createDemoCqiReport(course, weeklyPlan, 3);
  const markdown = renderCqiReportMarkdown(report);

  assert.equal(report.report_type, 'cqi_summary_v1');
  assert.equal(report.context.course_id, 'SMAC001');
  assert.equal(report.context.module_id, 'SMAC001_w03');
  assert.equal(report.context.week, 3);
  assert.ok(report.overview.total_clos >= 5);
  assert.ok(report.overview.score_event_count >= 2);
  assert.ok(report.overview.reflection_event_count >= 1);
  assert.ok(report.clo_reports.some((item) => item.clo_id === 'CLO1'));
  assert.ok(markdown.includes('# CQI Summary Report'));
  assert.ok(markdown.includes('### CLO1'));
  assert.ok(markdown.includes('## Overview'));
}

console.log('cqi report tests passed');
