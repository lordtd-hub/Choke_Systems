'use strict';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getModuleActivity(bundle, activityId) {
  const activity = bundle?.interactive_module?.activities?.find((item) => item.activity_id === activityId);
  if (!activity) {
    throw new Error(`Unknown activity "${activityId}" in bundle.`);
  }
  return activity;
}

function getSbraPayload(bundle, activityId) {
  return bundle?.sbra_payloads?.find((item) => item.activity_id === activityId) || null;
}

function buildBaseResult(bundle, activityId, activityType) {
  const activity = getModuleActivity(bundle, activityId);
  const sbraPayload = getSbraPayload(bundle, activityId);

  return {
    activity_id: activityId,
    activity_type: activityType,
    clo_mapping: clone(activity.clo_mapping),
    assessment_links: clone(sbraPayload?.assessment_links || []),
    evidence_tags: clone(sbraPayload?.evidence_tags || []),
    score_ratio: 0,
    score_percent: 0,
    passed: false,
    breakdown: [],
    summary: '',
    scoring_context: {}
  };
}

function normalizePercent(ratio) {
  return Math.round(ratio * 10000) / 100;
}

function resolveXp(scoringModel, scoreRatio, confidenceBonus = 0) {
  if (!scoringModel?.xp_enabled) {
    return null;
  }

  if (scoringModel.xp_rule === '45 * score_ratio + confidence_bonus') {
    return Math.round((45 * scoreRatio + confidenceBonus) * 100) / 100;
  }

  return null;
}

function scoreSbraStep(step, responseStep, scoringModel) {
  const levels = scoringModel.levels || {};
  const selectedOptionId = responseStep?.selected_option_id || null;
  const attemptCount = Math.max(1, Number(responseStep?.attempt_count || 1));
  const selectedOption = step.options.find((option) => option.option_id === selectedOptionId) || null;
  const isCorrect = selectedOptionId === step.correct_option_id;

  let levelKey = 'missing_or_invalid';
  if (isCorrect && attemptCount <= 1) {
    levelKey = 'first_try_correct';
  } else if (isCorrect && attemptCount === 2) {
    levelKey = 'one_minor_error';
  } else if (isCorrect && attemptCount >= 3) {
    levelKey = 'multiple_errors';
  }

  const scoreRatio = Number(levels[levelKey] ?? 0);

  return {
    step_no: step.step_no,
    prompt: step.prompt,
    selected_option_id: selectedOptionId,
    correct_option_id: step.correct_option_id,
    attempt_count: attemptCount,
    is_correct: isCorrect,
    level: levelKey,
    score_ratio: scoreRatio,
    selected_error_type: selectedOption?.error_type || null,
    explanation: step.explanation
  };
}

function scoreSbraSubmission(bundle, activityId, submission = {}) {
  const result = buildBaseResult(bundle, activityId, 'sbra');
  const payload = getSbraPayload(bundle, activityId);

  if (!payload) {
    throw new Error(`SBRA payload for "${activityId}" is missing from the bundle.`);
  }
  if (!payload.blueprint) {
    throw new Error(`SBRA blueprint for "${activityId}" is missing from the bundle.`);
  }
  if (!payload.rubric?.scoring_model) {
    throw new Error(`SBRA rubric scoring model for "${activityId}" is missing from the bundle.`);
  }

  const stepResponsesByNo = new Map((submission.steps || []).map((step) => [step.step_no, step]));
  const scoringModel = payload.rubric.scoring_model;
  const breakdown = payload.blueprint.steps.map((step) => scoreSbraStep(step, stepResponsesByNo.get(step.step_no), scoringModel));
  const totalRatio = breakdown.length === 0
    ? 0
    : breakdown.reduce((sum, item) => sum + item.score_ratio, 0) / breakdown.length;
  const scorePercent = normalizePercent(totalRatio);
  const passThreshold = Number(scoringModel.pass_threshold_percent ?? 0);
  const confidenceBonus = Number(submission.confidence_bonus || 0);

  result.score_ratio = Math.round(totalRatio * 10000) / 10000;
  result.score_percent = scorePercent;
  result.passed = scorePercent >= passThreshold;
  result.breakdown = breakdown;
  result.summary = `${breakdown.filter((item) => item.is_correct).length}/${breakdown.length} steps correct; weighted score ${scorePercent}%`;
  result.scoring_context = {
    rubric_id: payload.rubric.rubric_id,
    blueprint_id: payload.blueprint.blueprint_id,
    scoring_model: clone(scoringModel),
    pass_threshold_percent: passThreshold,
    xp_awarded: resolveXp(scoringModel, totalRatio, confidenceBonus)
  };

  return result;
}

function scoreQuizItem(item, index) {
  const maxPoints = Number(item.max_points ?? 1);
  let isCorrect = false;
  let earnedPoints = 0;

  if (typeof item.is_correct === 'boolean') {
    isCorrect = item.is_correct;
    earnedPoints = isCorrect ? maxPoints : 0;
  } else if (Object.prototype.hasOwnProperty.call(item, 'earned_points')) {
    earnedPoints = Number(item.earned_points || 0);
    isCorrect = earnedPoints >= maxPoints;
  } else if (Object.prototype.hasOwnProperty.call(item, 'correct_answer')) {
    isCorrect = item.learner_answer === item.correct_answer;
    earnedPoints = isCorrect ? maxPoints : 0;
  } else {
    throw new Error(`Quiz item ${item.item_id || index + 1} must provide is_correct, earned_points, or correct_answer.`);
  }

  return {
    item_id: item.item_id || `item_${String(index + 1).padStart(2, '0')}`,
    learner_answer: Object.prototype.hasOwnProperty.call(item, 'learner_answer') ? item.learner_answer : null,
    correct_answer: Object.prototype.hasOwnProperty.call(item, 'correct_answer') ? item.correct_answer : null,
    is_correct: isCorrect,
    earned_points: earnedPoints,
    max_points: maxPoints
  };
}

function scoreQuizSubmission(bundle, activityId, submission = {}) {
  const result = buildBaseResult(bundle, activityId, 'quiz');
  const activity = getModuleActivity(bundle, activityId);
  const itemResults = (submission.items || []).map(scoreQuizItem);

  if (itemResults.length === 0) {
    throw new Error(`Quiz submission for "${activityId}" must include at least one item.`);
  }

  const totalEarned = itemResults.reduce((sum, item) => sum + item.earned_points, 0);
  const totalPossible = itemResults.reduce((sum, item) => sum + item.max_points, 0);
  const totalRatio = totalPossible === 0 ? 0 : totalEarned / totalPossible;
  const scorePercent = normalizePercent(totalRatio);
  const passThreshold = Number(submission.pass_threshold_percent ?? 60);

  result.score_ratio = Math.round(totalRatio * 10000) / 10000;
  result.score_percent = scorePercent;
  result.passed = scorePercent >= passThreshold;
  result.breakdown = itemResults;
  result.summary = `${itemResults.filter((item) => item.is_correct).length}/${itemResults.length} items correct; score ${scorePercent}%`;
  result.scoring_context = {
    activity_type: activity.type,
    pass_threshold_percent: passThreshold,
    total_items: itemResults.length,
    total_points_earned: totalEarned,
    total_points_possible: totalPossible
  };

  return result;
}

function scoreActivitySubmission(bundle, activityId, submission = {}) {
  const activity = getModuleActivity(bundle, activityId);

  if (activity.type === 'sbra') {
    return scoreSbraSubmission(bundle, activityId, submission);
  }

  if (activity.type === 'quiz') {
    return scoreQuizSubmission(bundle, activityId, submission);
  }

  throw new Error(`Scoring for activity type "${activity.type}" is not implemented for "${activityId}".`);
}

module.exports = {
  scoreActivitySubmission,
  scoreQuizSubmission,
  scoreSbraSubmission
};
