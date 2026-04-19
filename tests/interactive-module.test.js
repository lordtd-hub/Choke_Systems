'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const {
  buildInteractiveModule,
  validateInteractiveModule,
  validateReferenceIntegrity
} = require('../tools/build-interactive-module');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const coursePath = path.join(__dirname, '..', 'calculus1_course.yaml');
const weeklyPlanPath = path.join(__dirname, '..', 'calculus1_weekly_plan.yaml');
const course = readYaml(coursePath);
const weeklyPlan = readYaml(weeklyPlanPath);

{
  const moduleWeek1 = buildInteractiveModule(course, weeklyPlan, 1);
  const schemaResult = validateInteractiveModule(moduleWeek1);
  const refErrors = validateReferenceIntegrity(moduleWeek1);

  assert.equal(schemaResult.isValid, true, 'generated week 1 module should satisfy the interactive module schema');
  assert.deepEqual(refErrors, [], 'generated week 1 module should have valid refs');
  assert.equal(moduleWeek1.interactive_module.module_id, 'SMAC001_w01');
  assert.equal(moduleWeek1.interactive_module.week, 1);
  assert.equal(moduleWeek1.interactive_module.clo_focus.primary, 'CLO1');
  assert.deepEqual(moduleWeek1.interactive_module.evidence_hooks.types, ['completion', 'score', 'reflection']);
  assert.equal(moduleWeek1.interactive_module.learning_flow[0].section_type, 'intro');
  assert.match(moduleWeek1.interactive_module.content_blocks[0].content, /Primary outcome: CLO1/);
  assert.match(moduleWeek1.interactive_module.content_blocks[1].content, /Teaching strategies:/);
}

{
  const moduleWeek3 = buildInteractiveModule(course, weeklyPlan, 3);
  const schemaResult = validateInteractiveModule(moduleWeek3);
  const refErrors = validateReferenceIntegrity(moduleWeek3);

  assert.equal(schemaResult.isValid, true, 'generated week 3 module should satisfy the interactive module schema');
  assert.deepEqual(refErrors, [], 'generated week 3 module should have valid refs');
  assert.ok(
    moduleWeek3.interactive_module.learning_flow.some((section) => section.section_type === 'sbra'),
    'week 3 should include an sbra section'
  );
  assert.ok(
    moduleWeek3.interactive_module.learning_flow.some((section) => section.section_type === 'quiz'),
    'week 3 should include a quiz section'
  );
  assert.deepEqual(moduleWeek3.interactive_module.evidence_hooks.types, ['completion', 'score', 'reflection']);
  assert.ok(
    moduleWeek3.interactive_module.content_blocks.some((block) => block.content.includes('Type: SBRA Worksheet')),
    'week 3 should enrich activity notes with activity type context'
  );
  assert.ok(
    moduleWeek3.interactive_module.content_blocks.some((block) => block.content.includes('Assessment links: ASM-QUIZ')),
    'week 3 should enrich activity notes with assessment context'
  );
}

console.log('interactive module tests passed');
