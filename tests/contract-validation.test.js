'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const {
  normalizeEvidenceName,
  validateContracts,
  validateCourseInternals,
  validateWeeklyPlanAgainstCourse
} = require('../tools/validate-contracts');
const YAML = require('yaml');
const fs = require('node:fs');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getIssueMessages(issues) {
  return issues.map((issue) => issue.message);
}

const coursePath = path.join(__dirname, '..', 'calculus1_course.yaml');
const weeklyPlanPath = path.join(__dirname, '..', 'calculus1_weekly_plan.yaml');
const baseCourse = readYaml(coursePath);
const baseWeeklyPlan = readYaml(weeklyPlanPath);

{
  const result = validateContracts(coursePath, weeklyPlanPath);
  assert.equal(result.errors.length, 0, 'sample contracts should pass structural and cross-file validation');
  assert.equal(result.warnings.length, 0, 'sample contracts should validate cleanly after normalization');
}

{
  assert.equal(normalizeEvidenceName('exercise_result'), 'quiz_or_exercise_result');
  assert.equal(normalizeEvidenceName('activity_artifact'), 'activity_artifact');
}

{
  const brokenCourse = clone(baseCourse);
  brokenCourse.course.cilos[0].mapped_plos = ['PLO-UNKNOWN'];
  const issues = validateCourseInternals(brokenCourse);
  assert.ok(
    getIssueMessages(issues).some((message) => message.includes('unknown PLO "PLO-UNKNOWN"')),
    'broken CLO to PLO alignment should be detected'
  );
}

{
  const brokenWeeklyPlan = clone(baseWeeklyPlan);
  brokenWeeklyPlan.weekly_plan.weekly_units[0].activities[0].assessment_links = ['ASM-NOT-REAL'];
  const issues = validateWeeklyPlanAgainstCourse(baseCourse, brokenWeeklyPlan, coursePath, weeklyPlanPath);
  assert.ok(
    getIssueMessages(issues).some((message) => message.includes('unknown assessment "ASM-NOT-REAL"')),
    'unknown assessment references should be detected'
  );
}

{
  const brokenWeeklyPlan = clone(baseWeeklyPlan);
  brokenWeeklyPlan.weekly_plan.weekly_units[0].strategy_mapping.primary_strategies = ['STRAT-NOT-REAL'];
  const issues = validateWeeklyPlanAgainstCourse(baseCourse, brokenWeeklyPlan, coursePath, weeklyPlanPath);
  assert.ok(
    getIssueMessages(issues).some((message) => message.includes('unknown strategy "STRAT-NOT-REAL"')),
    'unknown strategy references should be detected'
  );
}

console.log('contract validation tests passed');
