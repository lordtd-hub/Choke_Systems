'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const Ajv2020 = require('ajv/dist/2020');

function readYamlFile(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function findWeeklyUnit(weeklyPlan, weekNumber) {
  return weeklyPlan.weekly_plan.weekly_units.find((unit) => unit.week === weekNumber);
}

function indexBy(items, key) {
  return new Map(items.map((item) => [item[key], item]));
}

function slugWeek(week) {
  return String(week).padStart(2, '0');
}

function inferSectionType(activityTypeId) {
  switch (activityTypeId) {
    case 'ACT-WE':
      return 'example';
    case 'ACT-SBRA':
      return 'sbra';
    case 'ACT-QUIZ':
      return 'quiz';
    case 'ACT-REFLECT':
      return 'reflection';
    default:
      return 'practice';
  }
}

function inferActivityType(activityTypeId) {
  switch (activityTypeId) {
    case 'ACT-SBRA':
      return 'sbra';
    case 'ACT-QUIZ':
      return 'quiz';
    default:
      return 'practice';
  }
}

function unique(values) {
  return [...new Set(values)];
}

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function joinLabeledItems(label, items) {
  if (!items || items.length === 0) {
    return null;
  }
  return `${label}: ${items.join(', ')}`;
}

function summarizeClo(clo) {
  if (!clo) {
    return null;
  }

  return `${clo.clo_id} - ${cleanText(clo.statement)}`;
}

function summarizeAssessment(assessment) {
  if (!assessment) {
    return null;
  }

  return `${assessment.assessment_id} (${assessment.name})`;
}

function summarizeStrategy(strategy) {
  if (!strategy) {
    return null;
  }

  return `${strategy.name}: ${cleanText(strategy.description)}`;
}

function buildIntroContent(weekNumber, weeklyUnit, primaryClo, secondaryClos, assessmentFocus, expectedEvidence) {
  const lines = [
    `Week ${weekNumber}: ${weeklyUnit.title}`,
    `Primary outcome: ${summarizeClo(primaryClo) || weeklyUnit.clo_mapping.primary_clo}`,
    joinLabeledItems('Secondary support', secondaryClos.map((clo) => summarizeClo(clo)).filter(Boolean)),
    `Weekly scope: ${weeklyUnit.topics.length} topic(s), ${weeklyUnit.activities.length} activity(ies)`,
    joinLabeledItems('Assessment focus', assessmentFocus.map((assessment) => summarizeAssessment(assessment)).filter(Boolean)),
    joinLabeledItems('Expected evidence', expectedEvidence)
  ];

  return lines.filter(Boolean).join('\n');
}

function buildClusterContent(weeklyCluster, primaryClo, strategyFocus) {
  const lines = [
    `Cluster: ${weeklyCluster.title}`,
    cleanText(weeklyCluster.description),
    primaryClo ? `Outcome anchor: ${summarizeClo(primaryClo)}` : null,
    joinLabeledItems('Teaching strategies', strategyFocus)
  ];

  return lines.filter(Boolean).join('\n');
}

function buildTopicContent(topic, index, totalTopics, primaryClo, primaryStrategies) {
  const lines = [
    `Topic ${String(index + 1).padStart(2, '0')} of ${totalTopics}: ${cleanText(topic)}`,
    primaryClo ? `Outcome focus: ${primaryClo.clo_id}` : null,
    primaryClo && Array.isArray(primaryClo.performance_indicators) && primaryClo.performance_indicators[index % primaryClo.performance_indicators.length]
      ? `Target performance: ${cleanText(primaryClo.performance_indicators[index % primaryClo.performance_indicators.length])}`
      : null,
    joinLabeledItems('Suggested learning move', primaryStrategies)
  ];

  return lines.filter(Boolean).join('\n');
}

function buildActivityContent(activity, activityType, primaryClo, secondaryClos, linkedAssessments, rubric) {
  const lines = [
    activity.name,
    activityType ? `Type: ${activityType.name}` : null,
    primaryClo ? `Primary outcome: ${summarizeClo(primaryClo)}` : `Primary outcome: ${activity.primary_clo}`,
    joinLabeledItems('Secondary support', secondaryClos.map((clo) => clo.clo_id)),
    `Activity purpose: ${cleanText(activity.description)}`,
    joinLabeledItems('Assessment links', linkedAssessments.map((assessment) => summarizeAssessment(assessment)).filter(Boolean)),
    rubric ? `Rubric: ${rubric.rubric_id} (${rubric.name})` : null,
    joinLabeledItems('Evidence tags', activity.evidence_tags || []),
    `Deliverable: ${activity.deliverable}`
  ];

  return lines.filter(Boolean).join('\n');
}

function buildInteractiveModule(course, weeklyPlan, weekNumber) {
  const courseRoot = course.course;
  const weeklyUnit = findWeeklyUnit(weeklyPlan, weekNumber);

  if (!weeklyUnit) {
    throw new Error(`Week ${weekNumber} was not found in weekly_plan.weekly_units.`);
  }

  const clusterById = indexBy(courseRoot.content_clusters || [], 'cluster_id');
  const cloById = indexBy(courseRoot.cilos || [], 'clo_id');
  const strategyById = indexBy(((courseRoot.teaching_strategies || {}).strategy_catalog) || [], 'strategy_id');
  const activityTypeById = indexBy(courseRoot.activity_types || [], 'activity_type_id');
  const assessmentById = indexBy(((courseRoot.assessment || {}).components) || [], 'assessment_id');
  const rubricById = indexBy(((courseRoot.rubrics || {}).rubric_catalog) || [], 'rubric_id');
  const weeklyCluster = clusterById.get(weeklyUnit.content_cluster_id);
  if (!weeklyCluster) {
    throw new Error(`Week ${weekNumber} references unknown content cluster "${weeklyUnit.content_cluster_id}".`);
  }

  const primaryClo = cloById.get(weeklyUnit.clo_mapping.primary_clo);
  const secondaryClos = (weeklyUnit.clo_mapping.secondary_clos || []).map((cloId) => cloById.get(cloId)).filter(Boolean);
  const primaryStrategies = (weeklyUnit.strategy_mapping?.primary_strategies || [])
    .map((strategyId) => strategyById.get(strategyId))
    .filter(Boolean);
  const secondaryStrategies = (weeklyUnit.strategy_mapping?.secondary_strategies || [])
    .map((strategyId) => strategyById.get(strategyId))
    .filter(Boolean);
  const strategyFocus = [
    ...primaryStrategies.map((strategy) => summarizeStrategy(strategy)),
    ...secondaryStrategies.map((strategy) => summarizeStrategy(strategy))
  ];
  const assessmentFocus = (weeklyUnit.weekly_assessment_focus?.assessment_ids || [])
    .map((assessmentId) => assessmentById.get(assessmentId))
    .filter(Boolean);

  const weekToken = slugWeek(weekNumber);
  const moduleId = `${courseRoot.course_id}_w${weekToken}`;
  const introBlockId = `${moduleId}_intro`;
  const clusterBlockId = `${moduleId}_cluster`;

  const contentBlocks = [
    {
      block_id: introBlockId,
      type: 'note',
      content: buildIntroContent(weekNumber, weeklyUnit, primaryClo, secondaryClos, assessmentFocus, weeklyUnit.expected_evidence || []),
      clo_link: weeklyUnit.clo_mapping.primary_clo
    },
    {
      block_id: clusterBlockId,
      type: 'text',
      content: buildClusterContent(weeklyCluster, primaryClo, strategyFocus),
      clo_link: weeklyUnit.clo_mapping.primary_clo
    }
  ];

  weeklyUnit.topics.forEach((topic, index) => {
    contentBlocks.push({
      block_id: `${moduleId}_topic_${String(index + 1).padStart(2, '0')}`,
      type: 'text',
      content: buildTopicContent(topic, index, weeklyUnit.topics.length, primaryClo, primaryStrategies.map((strategy) => strategy.name)),
      clo_link: weeklyUnit.clo_mapping.primary_clo
    });
  });

  const activities = [];
  const learningFlow = [
    {
      section_id: `${moduleId}_intro_section`,
      section_type: 'intro',
      block_refs: [introBlockId],
      activity_refs: []
    },
    {
      section_id: `${moduleId}_content_section`,
      section_type: 'content',
      block_refs: [clusterBlockId, ...contentBlocks.filter((block) => block.block_id.includes('_topic_')).map((block) => block.block_id)],
      activity_refs: []
    }
  ];

  weeklyUnit.activities.forEach((activity, index) => {
    const activityBlockId = `${moduleId}_activity_${String(index + 1).padStart(2, '0')}`;
    const activityType = activityTypeById.get(activity.activity_type_id);
    const activityPrimaryClo = cloById.get(activity.primary_clo);
    const activitySecondaryClos = (activity.secondary_clos || []).map((cloId) => cloById.get(cloId)).filter(Boolean);
    const linkedAssessments = (activity.assessment_links || []).map((assessmentId) => assessmentById.get(assessmentId)).filter(Boolean);
    const rubric = activity.rubric_id ? rubricById.get(activity.rubric_id) : null;

    contentBlocks.push({
      block_id: activityBlockId,
      type: inferSectionType(activity.activity_type_id) === 'example' ? 'example' : 'note',
      content: buildActivityContent(activity, activityType, activityPrimaryClo, activitySecondaryClos, linkedAssessments, rubric),
      clo_link: activity.primary_clo
    });

    activities.push({
      activity_id: activity.activity_id,
      type: inferActivityType(activity.activity_type_id),
      clo_mapping: {
        primary: activity.primary_clo,
        secondary: activity.secondary_clos || []
      }
    });

    learningFlow.push({
      section_id: `${moduleId}_${inferSectionType(activity.activity_type_id)}_${String(index + 1).padStart(2, '0')}`,
      section_type: inferSectionType(activity.activity_type_id),
      block_refs: [activityBlockId],
      activity_refs: [activity.activity_id]
    });
  });

  const requiredSections = learningFlow.map((section) => section.section_id);
  const requiredActivities = activities.map((activity) => activity.activity_id);
  const gradedActivities = weeklyUnit.activities
    .filter((activity) => (activity.assessment_links || []).length > 0)
    .map((activity) => activity.activity_id);

  const evidenceTypes = ['completion'];
  if (
    weeklyUnit.expected_evidence.some((evidence) => ['quiz_or_exercise_result', 'exam_result', 'item_analysis', 'clo_summary'].includes(evidence)) ||
    gradedActivities.length > 0
  ) {
    evidenceTypes.push('score');
  }
  if (
    weeklyUnit.expected_evidence.includes('teaching_reflection') ||
    weeklyUnit.activities.some((activity) => activity.activity_type_id === 'ACT-REFLECT')
  ) {
    evidenceTypes.push('reflection');
  }

  return {
    interactive_module: {
      module_id: moduleId,
      course_id: courseRoot.course_id,
      week: weekNumber,
      title: weeklyUnit.title,
      clo_focus: {
        primary: weeklyUnit.clo_mapping.primary_clo,
        secondary: weeklyUnit.clo_mapping.secondary_clos || []
      },
      learning_flow: learningFlow,
      content_blocks: contentBlocks,
      activities,
      progress_hooks: {
        required_sections: requiredSections,
        required_activities: requiredActivities
      },
      assessment_hooks: {
        graded_activities: gradedActivities
      },
      evidence_hooks: {
        types: unique(evidenceTypes)
      }
    }
  };
}

function validateInteractiveModule(interactiveModule) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false
  });
  const schema = readJsonFile(path.join(__dirname, '..', 'schemas', 'interactive_module.schema.json'));
  const validate = ajv.compile(schema);
  const isValid = validate(interactiveModule);
  return {
    isValid,
    errors: validate.errors || []
  };
}

function validateReferenceIntegrity(interactiveModule) {
  const moduleRoot = interactiveModule.interactive_module;
  const errors = [];
  const blockIds = new Set(moduleRoot.content_blocks.map((block) => block.block_id));
  const activityIds = new Set(moduleRoot.activities.map((activity) => activity.activity_id));

  moduleRoot.learning_flow.forEach((section) => {
    section.block_refs.forEach((blockId) => {
      if (!blockIds.has(blockId)) {
        errors.push(`Section "${section.section_id}" references missing block "${blockId}".`);
      }
    });
    section.activity_refs.forEach((activityId) => {
      if (!activityIds.has(activityId)) {
        errors.push(`Section "${section.section_id}" references missing activity "${activityId}".`);
      }
    });
  });

  moduleRoot.progress_hooks.required_sections.forEach((sectionId) => {
    if (!moduleRoot.learning_flow.some((section) => section.section_id === sectionId)) {
      errors.push(`progress_hooks.required_sections references missing section "${sectionId}".`);
    }
  });

  moduleRoot.progress_hooks.required_activities.forEach((activityId) => {
    if (!activityIds.has(activityId)) {
      errors.push(`progress_hooks.required_activities references missing activity "${activityId}".`);
    }
  });

  moduleRoot.assessment_hooks.graded_activities.forEach((activityId) => {
    if (!activityIds.has(activityId)) {
      errors.push(`assessment_hooks.graded_activities references missing activity "${activityId}".`);
    }
  });

  return errors;
}

if (require.main === module) {
  const [, , coursePathArg, weeklyPlanPathArg, weekArg] = process.argv;

  if (!coursePathArg || !weeklyPlanPathArg || !weekArg) {
    console.error('Usage: node tools/build-interactive-module.js <course.yaml> <weekly_plan.yaml> <week>');
    process.exit(1);
  }

  const coursePath = path.resolve(process.cwd(), coursePathArg);
  const weeklyPlanPath = path.resolve(process.cwd(), weeklyPlanPathArg);
  const weekNumber = Number(weekArg);
  const course = readYamlFile(coursePath);
  const weeklyPlan = readYamlFile(weeklyPlanPath);
  const interactiveModule = buildInteractiveModule(course, weeklyPlan, weekNumber);
  const schemaValidation = validateInteractiveModule(interactiveModule);
  const refErrors = validateReferenceIntegrity(interactiveModule);

  if (!schemaValidation.isValid) {
    schemaValidation.errors.forEach((error) => {
      console.error(`ERROR: ${error.instancePath || '/'} ${error.message}`);
    });
    process.exit(1);
  }

  if (refErrors.length > 0) {
    refErrors.forEach((message) => console.error(`ERROR: ${message}`));
    process.exit(1);
  }

  process.stdout.write(`${JSON.stringify(interactiveModule, null, 2)}\n`);
}

module.exports = {
  buildInteractiveModule,
  inferActivityType,
  inferSectionType,
  validateInteractiveModule,
  validateReferenceIntegrity
};
