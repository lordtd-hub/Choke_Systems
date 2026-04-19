'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { loadManifest } = require('./material-library');
const { DEFAULT_REGISTRY_PATH, validateRegistryAndBlueprints } = require('./sbra-blueprints');
const { buildWeekBundle } = require('./build-week-bundle');
const { createRuntimeState, markActivityCompleted, markSectionCompleted } = require('./runtime-state');
const { scoreActivitySubmission } = require('./assessment-engine');
const { buildCqiReport, renderCqiReportMarkdown } = require('./cqi-report');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildDemoSbraSubmission(payload) {
  return {
    steps: (payload.blueprint?.steps || []).map((step, index) => ({
      step_no: step.step_no,
      selected_option_id: step.correct_option_id,
      attempt_count: index === 1 ? 2 : 1
    }))
  };
}

function buildDemoQuizSubmission() {
  return {
    items: [
      { item_id: 'Q1', learner_answer: 'A', correct_answer: 'A', max_points: 1 },
      { item_id: 'Q2', learner_answer: 'B', correct_answer: 'B', max_points: 1 },
      { item_id: 'Q3', learner_answer: 'C', correct_answer: 'D', max_points: 1 }
    ]
  };
}

function buildDemoReflection(activityId, timestamp) {
  return {
    activity_id: activityId,
    timestamp,
    text: 'Learner reflection captured for CQI prototype review.',
    evidence_tags: ['reflection', 'demo']
  };
}

function createDemoCqiReport(course, weeklyPlan, weekNumber) {
  const manifest = loadManifest();
  const { blueprintsByActivityId } = validateRegistryAndBlueprints(DEFAULT_REGISTRY_PATH);
  const bundle = buildWeekBundle(course, weeklyPlan, weekNumber, manifest, blueprintsByActivityId);
  let runtimeState = createRuntimeState(bundle, { now: '2026-04-20T09:00:00.000Z' });

  bundle.interactive_module.learning_flow.forEach((section, index) => {
    runtimeState = markSectionCompleted(runtimeState, section.section_id, {
      completedAt: `2026-04-20T09:${String(index + 1).padStart(2, '0')}:00.000Z`
    });
  });

  const assessmentResults = [];
  const reflections = [];

  bundle.interactive_module.activities.forEach((activity, index) => {
    const completedAt = `2026-04-20T10:${String(index + 1).padStart(2, '0')}:00.000Z`;
    runtimeState = markActivityCompleted(runtimeState, activity.activity_id, {
      completedAt,
      attemptId: `${activity.activity_id}_attempt_01`
    });

    if (activity.type === 'sbra') {
      const payload = bundle.sbra_payloads.find((item) => item.activity_id === activity.activity_id);
      assessmentResults.push(scoreActivitySubmission(bundle, activity.activity_id, buildDemoSbraSubmission(payload)));
    }

    if (activity.type === 'quiz') {
      assessmentResults.push(scoreActivitySubmission(bundle, activity.activity_id, buildDemoQuizSubmission()));
    }

    if (activity.type === 'practice' && activity.activity_id.endsWith('A3')) {
      reflections.push(buildDemoReflection(activity.activity_id, `2026-04-20T11:${String(index + 1).padStart(2, '0')}:00.000Z`));
    }
  });

  return buildCqiReport({
    course,
    bundle,
    runtimeState,
    assessmentResults,
    reflections,
    generatedAt: runtimeState.runtime_state.updated_at
  });
}

if (require.main === module) {
  const [, , coursePathArg, weeklyPlanPathArg, weekArg] = process.argv;

  if (!coursePathArg || !weeklyPlanPathArg || !weekArg) {
    console.error('Usage: node tools/render-demo-cqi-report.js <course.yaml> <weekly_plan.yaml> <week>');
    process.exit(1);
  }

  const course = readYaml(path.resolve(process.cwd(), coursePathArg));
  const weeklyPlan = readYaml(path.resolve(process.cwd(), weeklyPlanPathArg));
  const weekNumber = Number(weekArg);
  const report = createDemoCqiReport(course, weeklyPlan, weekNumber);

  process.stdout.write(`${renderCqiReportMarkdown(report)}\n`);
}

module.exports = {
  createDemoCqiReport
};
