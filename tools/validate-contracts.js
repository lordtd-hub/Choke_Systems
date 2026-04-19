'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const Ajv2020 = require('ajv/dist/2020');

const EVIDENCE_ALIASES = {
  exercise_result: 'quiz_or_exercise_result'
};

function readYamlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return YAML.parse(content);
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildValidator() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false
  });

  const courseSchema = readJsonFile(path.join(__dirname, '..', 'schemas', 'course.schema.json'));
  const weeklyPlanSchema = readJsonFile(path.join(__dirname, '..', 'schemas', 'weekly_plan.schema.json'));
  const validateCourse = ajv.compile(courseSchema);
  const validateWeeklyPlan = ajv.compile(weeklyPlanSchema);

  return {
    validateCourse,
    validateWeeklyPlan
  };
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => {
    const location = error.instancePath || '/';
    return `${location} ${error.message}`;
  });
}

function pushIssue(target, severity, message) {
  target.push({ severity, message });
}

function unique(values) {
  return [...new Set(values)];
}

function collectCourseIndexes(course) {
  const courseRoot = course.course;
  return {
    courseRoot,
    ploIds: new Set((courseRoot.plo_alignment || []).map((item) => item.plo_id)),
    cloIds: new Set((courseRoot.cilos || []).map((item) => item.clo_id)),
    clusterIds: new Set((courseRoot.content_clusters || []).map((item) => item.cluster_id)),
    strategyIds: new Set(((courseRoot.teaching_strategies || {}).strategy_catalog || []).map((item) => item.strategy_id)),
    activityTypeIds: new Set((courseRoot.activity_types || []).map((item) => item.activity_type_id)),
    assessmentIds: new Set((((courseRoot.assessment || {}).components) || []).map((item) => item.assessment_id)),
    rubricIds: new Set((((courseRoot.rubrics || {}).rubric_catalog) || []).map((item) => item.rubric_id)),
    evidenceTypeIds: new Set((((courseRoot.learning_evidence || {}).evidence_type_catalog) || []).map((item) => item.evidence_type_id)),
    requiredEvidence: new Set((((courseRoot.learning_evidence || {}).required_weekly_evidence) || []))
  };
}

function checkDuplicateIds(label, values, issues) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  unique(duplicates).forEach((value) => {
    pushIssue(issues, 'error', `${label} contains duplicate id "${value}".`);
  });
}

function validateCourseInternals(course) {
  const issues = [];
  const { courseRoot, ploIds, cloIds, clusterIds, strategyIds, activityTypeIds, assessmentIds, rubricIds } = collectCourseIndexes(course);

  checkDuplicateIds('plo_alignment', (courseRoot.plo_alignment || []).map((item) => item.plo_id), issues);
  checkDuplicateIds('cilos', (courseRoot.cilos || []).map((item) => item.clo_id), issues);
  checkDuplicateIds('content_clusters', (courseRoot.content_clusters || []).map((item) => item.cluster_id), issues);
  checkDuplicateIds('strategy_catalog', (((courseRoot.teaching_strategies || {}).strategy_catalog) || []).map((item) => item.strategy_id), issues);
  checkDuplicateIds('activity_types', (courseRoot.activity_types || []).map((item) => item.activity_type_id), issues);
  checkDuplicateIds('assessment.components', ((((courseRoot.assessment || {}).components) || [])).map((item) => item.assessment_id), issues);
  checkDuplicateIds('rubric_catalog', ((((courseRoot.rubrics || {}).rubric_catalog) || [])).map((item) => item.rubric_id), issues);
  checkDuplicateIds('learning_evidence.evidence_type_catalog', ((((courseRoot.learning_evidence || {}).evidence_type_catalog) || [])).map((item) => item.evidence_type_id), issues);

  (courseRoot.cilos || []).forEach((clo) => {
    (clo.mapped_plos || []).forEach((ploId) => {
      if (!ploIds.has(ploId)) {
        pushIssue(issues, 'error', `CLO "${clo.clo_id}" maps to unknown PLO "${ploId}".`);
      }
    });
  });

  (courseRoot.content_clusters || []).forEach((cluster) => {
    (cluster.related_clos || []).forEach((cloId) => {
      if (!cloIds.has(cloId)) {
        pushIssue(issues, 'error', `Content cluster "${cluster.cluster_id}" references unknown CLO "${cloId}".`);
      }
    });
  });

  (((courseRoot.teaching_strategies || {}).clo_strategy_map) || []).forEach((mapping) => {
    if (!cloIds.has(mapping.clo_id)) {
      pushIssue(issues, 'error', `CLO strategy map references unknown CLO "${mapping.clo_id}".`);
    }
    [...(mapping.primary_strategies || []), ...(mapping.secondary_strategies || [])].forEach((strategyId) => {
      if (!strategyIds.has(strategyId)) {
        pushIssue(issues, 'error', `CLO strategy map for "${mapping.clo_id}" references unknown strategy "${strategyId}".`);
      }
    });
  });

  ((((courseRoot.assessment || {}).components) || [])).forEach((assessment) => {
    (assessment.related_clos || []).forEach((cloId) => {
      if (!cloIds.has(cloId)) {
        pushIssue(issues, 'error', `Assessment "${assessment.assessment_id}" references unknown CLO "${cloId}".`);
      }
    });
  });

  ((((courseRoot.assessment || {}).clo_assessment_map) || [])).forEach((mapping) => {
    if (!cloIds.has(mapping.clo_id)) {
      pushIssue(issues, 'error', `CLO assessment map references unknown CLO "${mapping.clo_id}".`);
    }
    [...(mapping.direct_assessments || []), ...(mapping.indirect_assessments || [])].forEach((assessmentId) => {
      if (!assessmentIds.has(assessmentId)) {
        pushIssue(issues, 'error', `CLO assessment map for "${mapping.clo_id}" references unknown assessment "${assessmentId}".`);
      }
    });
  });

  ((((courseRoot.rubrics || {}).rubric_catalog) || [])).forEach((rubric) => {
    (rubric.applies_to || []).forEach((targetId) => {
      if (!activityTypeIds.has(targetId) && !assessmentIds.has(targetId)) {
        pushIssue(issues, 'error', `Rubric "${rubric.rubric_id}" applies to unknown target "${targetId}".`);
      }
    });
  });

  (((courseRoot.learning_evidence || {}).clo_evidence_examples) || Object.create(null));
  Object.keys(((courseRoot.learning_evidence || {}).clo_evidence_examples) || {}).forEach((cloId) => {
    if (!cloIds.has(cloId)) {
      pushIssue(issues, 'error', `Learning evidence examples reference unknown CLO "${cloId}".`);
    }
  });

  const weeklyFields = ((courseRoot.weekly_plan_linking || {}).weekly_fields_required_from_course) || [];
  const allowedWeeklyFieldRefs = new Set(['clo_id', 'strategy_id', 'activity_type_id', 'assessment_id', 'content_cluster_id']);
  weeklyFields.forEach((fieldName) => {
    if (!allowedWeeklyFieldRefs.has(fieldName)) {
      pushIssue(issues, 'warning', `weekly_fields_required_from_course contains non-standard field "${fieldName}".`);
    }
  });

  ((courseRoot.learning_evidence || {}).required_weekly_evidence || []).forEach((evidenceTypeId) => {
    if (!(((courseRoot.learning_evidence || {}).evidence_type_catalog) || []).some((item) => item.evidence_type_id === evidenceTypeId)) {
      pushIssue(issues, 'error', `required_weekly_evidence references unknown evidence type "${evidenceTypeId}".`);
    }
  });

  if ((courseRoot.weekly_plan_linking || {}).expected_week_count < 1) {
    pushIssue(issues, 'error', 'weekly_plan_linking.expected_week_count must be at least 1.');
  }

  return issues;
}

function normalizeEvidenceName(name) {
  return EVIDENCE_ALIASES[name] || name;
}

function buildWeekPresenceMap(weeklyUnits, getIds) {
  const map = new Map();
  weeklyUnits.forEach((unit) => {
    unique(getIds(unit)).forEach((id) => {
      if (!map.has(id)) {
        map.set(id, []);
      }
      map.get(id).push(unit.week);
    });
  });
  return map;
}

function compareWeekMap(label, expectedMap, actualMap, issues) {
  Object.entries(expectedMap || {}).forEach(([id, expectedWeeks]) => {
    const actualWeeks = unique(actualMap.get(id) || []).sort((a, b) => a - b);
    const normalizedExpected = unique(expectedWeeks || []).sort((a, b) => a - b);
    if (JSON.stringify(actualWeeks) !== JSON.stringify(normalizedExpected)) {
      pushIssue(
        issues,
        'error',
        `${label} for "${id}" is out of sync. Expected [${normalizedExpected.join(', ')}], got [${actualWeeks.join(', ')}].`
      );
    }
  });
}

function validateWeeklyPlanAgainstCourse(course, weeklyPlan, coursePath, weeklyPlanPath) {
  const issues = [];
  const { courseRoot, ploIds, cloIds, clusterIds, strategyIds, activityTypeIds, assessmentIds, rubricIds, evidenceTypeIds } = collectCourseIndexes(course);
  const plan = weeklyPlan.weekly_plan;

  if (plan.course_ref.course_id !== courseRoot.course_id) {
    pushIssue(issues, 'error', `weekly_plan.course_ref.course_id "${plan.course_ref.course_id}" does not match course.course_id "${courseRoot.course_id}".`);
  }

  if (plan.course_ref.course_code !== courseRoot.course_code) {
    pushIssue(issues, 'error', `weekly_plan.course_ref.course_code "${plan.course_ref.course_code}" does not match course.course_code "${courseRoot.course_code}".`);
  }

  if (plan.course_ref.schema_version !== courseRoot.schema_version) {
    pushIssue(issues, 'error', `weekly_plan.course_ref.schema_version "${plan.course_ref.schema_version}" does not match course schema_version "${courseRoot.schema_version}".`);
  }

  if (plan.plan_metadata.total_weeks !== courseRoot.weekly_plan_linking.expected_week_count) {
    pushIssue(issues, 'error', `weekly plan total_weeks ${plan.plan_metadata.total_weeks} does not match expected_week_count ${courseRoot.weekly_plan_linking.expected_week_count}.`);
  }

  const expectedWeeklyFile = courseRoot.weekly_plan_linking.weekly_plan_file;
  const actualWeeklyFile = path.basename(weeklyPlanPath);
  if (actualWeeklyFile !== expectedWeeklyFile) {
    pushIssue(
      issues,
      'warning',
      `Course links to weekly plan file "${expectedWeeklyFile}" but the validated file is "${actualWeeklyFile}".`
    );
  }

  const actualCourseFile = path.basename(coursePath);
  if (plan.course_ref.source_file !== actualCourseFile) {
    pushIssue(
      issues,
      'warning',
      `weekly_plan.course_ref.source_file is "${plan.course_ref.source_file}" but the validated course file is "${actualCourseFile}".`
    );
  }

  const weekNumbers = plan.weekly_units.map((unit) => unit.week);
  checkDuplicateIds('weekly_units week numbers', weekNumbers, issues);

  plan.weekly_units.forEach((unit) => {
    if (!clusterIds.has(unit.content_cluster_id)) {
      pushIssue(issues, 'error', `Week ${unit.week} references unknown content cluster "${unit.content_cluster_id}".`);
    }

    const allWeekClos = [unit.clo_mapping.primary_clo, ...(unit.clo_mapping.secondary_clos || [])];
    allWeekClos.forEach((cloId) => {
      if (!cloIds.has(cloId)) {
        pushIssue(issues, 'error', `Week ${unit.week} references unknown CLO "${cloId}".`);
      }
    });

    [...(unit.strategy_mapping.primary_strategies || []), ...(unit.strategy_mapping.secondary_strategies || [])].forEach((strategyId) => {
      if (!strategyIds.has(strategyId)) {
        pushIssue(issues, 'error', `Week ${unit.week} references unknown strategy "${strategyId}".`);
      }
    });

    const activityIds = unit.activities.map((activity) => activity.activity_id);
    checkDuplicateIds(`Week ${unit.week} activity ids`, activityIds, issues);

    unit.activities.forEach((activity) => {
      if (!activityTypeIds.has(activity.activity_type_id)) {
        pushIssue(issues, 'error', `Activity "${activity.activity_id}" references unknown activity type "${activity.activity_type_id}".`);
      }

      [activity.primary_clo, ...(activity.secondary_clos || [])].forEach((cloId) => {
        if (!cloIds.has(cloId)) {
          pushIssue(issues, 'error', `Activity "${activity.activity_id}" references unknown CLO "${cloId}".`);
        }
      });

      (activity.assessment_links || []).forEach((assessmentId) => {
        if (!assessmentIds.has(assessmentId)) {
          pushIssue(issues, 'error', `Activity "${activity.activity_id}" references unknown assessment "${assessmentId}".`);
        }
      });

      if (activity.rubric_id && !rubricIds.has(activity.rubric_id)) {
        pushIssue(issues, 'error', `Activity "${activity.activity_id}" references unknown rubric "${activity.rubric_id}".`);
      }

      if (activity.activity_type_id === 'ACT-SBRA' && !activity.rubric_id) {
        pushIssue(issues, 'warning', `SBRA activity "${activity.activity_id}" should normally define a rubric_id for traceable assessment.`);
      }
    });

    (unit.weekly_assessment_focus.direct_clos || []).forEach((cloId) => {
      if (!cloIds.has(cloId)) {
        pushIssue(issues, 'error', `Week ${unit.week} weekly_assessment_focus references unknown CLO "${cloId}".`);
      }
    });

    (unit.weekly_assessment_focus.assessment_ids || []).forEach((assessmentId) => {
      if (!assessmentIds.has(assessmentId)) {
        pushIssue(issues, 'error', `Week ${unit.week} weekly_assessment_focus references unknown assessment "${assessmentId}".`);
      }
    });

    const activityAssessmentLinks = new Set(unit.activities.flatMap((activity) => activity.assessment_links || []));
    (unit.weekly_assessment_focus.assessment_ids || []).forEach((assessmentId) => {
      if (!activityAssessmentLinks.has(assessmentId)) {
        pushIssue(issues, 'error', `Week ${unit.week} lists assessment "${assessmentId}" in weekly_assessment_focus but no activity links to it.`);
      }
    });

    const availableActivityClos = new Set(unit.activities.flatMap((activity) => [activity.primary_clo, ...(activity.secondary_clos || [])]));
    (unit.weekly_assessment_focus.direct_clos || []).forEach((cloId) => {
      if (!availableActivityClos.has(cloId)) {
        pushIssue(issues, 'warning', `Week ${unit.week} lists direct CLO "${cloId}" in weekly_assessment_focus but no activity maps to it.`);
      }
    });

    (unit.expected_evidence || []).forEach((evidenceName) => {
      const normalized = normalizeEvidenceName(evidenceName);
      if (!evidenceTypeIds.has(normalized)) {
        pushIssue(issues, 'warning', `Week ${unit.week} uses expected evidence "${evidenceName}" which is outside the current normalized course evidence vocabulary.`);
      } else if (normalized !== evidenceName) {
        pushIssue(issues, 'warning', `Week ${unit.week} uses alias evidence name "${evidenceName}". Prefer canonical "${normalized}".`);
      }
    });
  });

  const cloWeekMap = buildWeekPresenceMap(plan.weekly_units, (unit) => [unit.clo_mapping.primary_clo, ...(unit.clo_mapping.secondary_clos || [])]);
  const activityTypeWeekMap = buildWeekPresenceMap(plan.weekly_units, (unit) => unit.activities.map((activity) => activity.activity_type_id));
  const assessmentWeekMap = buildWeekPresenceMap(
    plan.weekly_units,
    (unit) => unit.activities.flatMap((activity) => activity.assessment_links || [])
  );

  compareWeekMap('plan_level_maps.clo_to_weeks', plan.plan_level_maps.clo_to_weeks, cloWeekMap, issues);
  compareWeekMap('plan_level_maps.activity_type_to_weeks', plan.plan_level_maps.activity_type_to_weeks, activityTypeWeekMap, issues);
  compareWeekMap('plan_level_maps.assessment_to_weeks', plan.plan_level_maps.assessment_to_weeks, assessmentWeekMap, issues);

  const analyticsReadyFields = new Set(plan.implementation_notes.analytics_ready_fields || []);
  ['primary_clo', 'secondary_clos', 'activity_type_id', 'assessment_links'].forEach((fieldName) => {
    if (!analyticsReadyFields.has(fieldName)) {
      pushIssue(issues, 'warning', `implementation_notes.analytics_ready_fields should include "${fieldName}" for OBE/AUN-QA traceability.`);
    }
  });

  if (!analyticsReadyFields.has('evidence_tags')) {
    pushIssue(issues, 'warning', 'implementation_notes.analytics_ready_fields should include "evidence_tags" for evidence intelligence and CQI support.');
  }

  if (ploIds.size === 0) {
    pushIssue(issues, 'warning', 'No PLO alignments were found in the course spec; OBE traceability will be incomplete.');
  }

  return issues;
}

function summarizeIssues(issues) {
  return {
    errors: issues.filter((issue) => issue.severity === 'error'),
    warnings: issues.filter((issue) => issue.severity === 'warning')
  };
}

function validateContracts(coursePath, weeklyPlanPath) {
  const { validateCourse, validateWeeklyPlan } = buildValidator();
  const course = readYamlFile(coursePath);
  const weeklyPlan = readYamlFile(weeklyPlanPath);
  const issues = [];

  if (!validateCourse(course)) {
    formatAjvErrors(validateCourse.errors).forEach((message) => {
      pushIssue(issues, 'error', `course schema: ${message}`);
    });
  }

  if (!validateWeeklyPlan(weeklyPlan)) {
    formatAjvErrors(validateWeeklyPlan.errors).forEach((message) => {
      pushIssue(issues, 'error', `weekly_plan schema: ${message}`);
    });
  }

  if (issues.some((issue) => issue.severity === 'error')) {
    return summarizeIssues(issues);
  }

  validateCourseInternals(course).forEach((issue) => issues.push(issue));
  validateWeeklyPlanAgainstCourse(course, weeklyPlan, coursePath, weeklyPlanPath).forEach((issue) => issues.push(issue));

  return summarizeIssues(issues);
}

function printResult(result) {
  result.errors.forEach((issue) => {
    console.error(`ERROR: ${issue.message}`);
  });
  result.warnings.forEach((issue) => {
    console.warn(`WARN: ${issue.message}`);
  });

  if (result.errors.length === 0) {
    console.log(`Contracts validated with ${result.warnings.length} warning(s).`);
  }
}

if (require.main === module) {
  const [, , coursePathArg, weeklyPlanPathArg] = process.argv;

  if (!coursePathArg || !weeklyPlanPathArg) {
    console.error('Usage: node tools/validate-contracts.js <course.yaml> <weekly_plan.yaml>');
    process.exit(1);
  }

  const coursePath = path.resolve(process.cwd(), coursePathArg);
  const weeklyPlanPath = path.resolve(process.cwd(), weeklyPlanPathArg);
  const result = validateContracts(coursePath, weeklyPlanPath);
  printResult(result);
  process.exit(result.errors.length > 0 ? 1 : 0);
}

module.exports = {
  EVIDENCE_ALIASES,
  buildValidator,
  collectCourseIndexes,
  normalizeEvidenceName,
  validateContracts,
  validateCourseInternals,
  validateWeeklyPlanAgainstCourse
};
