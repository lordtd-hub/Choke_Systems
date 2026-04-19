'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { loadManifest } = require('../tools/material-library');
const { validateRegistryAndBlueprints, DEFAULT_REGISTRY_PATH } = require('../tools/sbra-blueprints');
const { buildWeekBundle } = require('../tools/build-week-bundle');
const { scoreActivitySubmission, scoreQuizSubmission, scoreSbraSubmission } = require('../tools/assessment-engine');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const course = readYaml(path.join(__dirname, '..', 'calculus1_course.yaml'));
const weeklyPlan = readYaml(path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'));
const manifest = loadManifest();
const { blueprintsByActivityId } = validateRegistryAndBlueprints(DEFAULT_REGISTRY_PATH);

{
  const bundle = buildWeekBundle(course, weeklyPlan, 3, manifest, blueprintsByActivityId);
  const result = scoreSbraSubmission(bundle, 'W3-A1', {
    confidence_bonus: 5,
    steps: [
      { step_no: 1, selected_option_id: 'opt_factor', attempt_count: 1 },
      { step_no: 2, selected_option_id: 'opt_x_plus_1', attempt_count: 1 },
      { step_no: 3, selected_option_id: 'opt_limit_vs_value', attempt_count: 1 }
    ]
  });

  assert.equal(result.activity_type, 'sbra');
  assert.equal(result.score_percent, 100);
  assert.equal(result.passed, true);
  assert.equal(result.breakdown.length, 3);
  assert.equal(result.breakdown[0].level, 'first_try_correct');
  assert.equal(result.scoring_context.rubric_id, 'RUBRIC-SBRA');
  assert.equal(result.scoring_context.blueprint_id, 'sbra_continuity_check_w3');
  assert.equal(result.scoring_context.xp_awarded, 50);
}

{
  const bundle = buildWeekBundle(course, weeklyPlan, 5, manifest, blueprintsByActivityId);
  const result = scoreActivitySubmission(bundle, 'W5-A1', {
    steps: [
      { step_no: 1, selected_option_id: 'opt_product_rule', attempt_count: 2 },
      { step_no: 2, selected_option_id: 'opt_uprimev_plus_uvprime', attempt_count: 3 },
      { step_no: 3, selected_option_id: 'opt_2_and_3x', attempt_count: 1 }
    ]
  });

  assert.equal(result.activity_id, 'W5-A1');
  assert.equal(result.activity_type, 'sbra');
  assert.equal(result.breakdown[0].score_ratio, 0.6);
  assert.equal(result.breakdown[1].score_ratio, 0.3);
  assert.equal(result.breakdown[2].score_ratio, 0);
  assert.equal(result.score_percent, 30);
  assert.equal(result.passed, false);
}

{
  const bundle = buildWeekBundle(course, weeklyPlan, 3, manifest, blueprintsByActivityId);
  const result = scoreQuizSubmission(bundle, 'W3-A2', {
    pass_threshold_percent: 70,
    items: [
      { item_id: 'Q1', learner_answer: 'A', correct_answer: 'A', max_points: 1 },
      { item_id: 'Q2', learner_answer: 'B', correct_answer: 'C', max_points: 1 },
      { item_id: 'Q3', is_correct: true, max_points: 2 }
    ]
  });

  assert.equal(result.activity_type, 'quiz');
  assert.equal(result.breakdown.length, 3);
  assert.equal(result.score_percent, 75);
  assert.equal(result.passed, true);
  assert.equal(result.scoring_context.total_points_earned, 3);
  assert.equal(result.scoring_context.total_points_possible, 4);
}

{
  const bundle = buildWeekBundle(course, weeklyPlan, 3, manifest, blueprintsByActivityId);
  assert.throws(
    () => scoreActivitySubmission(bundle, 'W3-A3', { items: [] }),
    /Scoring for activity type "practice" is not implemented/
  );
}

console.log('assessment engine tests passed');
