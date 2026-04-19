'use strict';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureModuleRoot(interactiveModule) {
  const moduleRoot = interactiveModule?.interactive_module;
  if (!moduleRoot) {
    throw new Error('interactive_module payload is required.');
  }
  return moduleRoot;
}

function isoNow(now) {
  if (!now) {
    return new Date().toISOString();
  }

  if (typeof now === 'string') {
    return now;
  }

  if (now instanceof Date) {
    return now.toISOString();
  }

  throw new Error('now must be a Date or ISO timestamp string when provided.');
}

function summarizeProgress(runtimeState) {
  const sectionItems = runtimeState.runtime_state.sections.filter((section) => section.required);
  const activityItems = runtimeState.runtime_state.activities.filter((activity) => activity.required);
  const requiredSectionsCompleted = sectionItems.filter((section) => section.status === 'completed').length;
  const requiredActivitiesCompleted = activityItems.filter((activity) => activity.status === 'completed').length;
  const totalRequiredItems = sectionItems.length + activityItems.length;
  const totalCompletedItems = requiredSectionsCompleted + requiredActivitiesCompleted;
  const progressPercent = totalRequiredItems === 0 ? 100 : Math.round((totalCompletedItems / totalRequiredItems) * 100);

  return {
    required_sections_total: sectionItems.length,
    required_sections_completed: requiredSectionsCompleted,
    required_activities_total: activityItems.length,
    required_activities_completed: requiredActivitiesCompleted,
    progress_percent: progressPercent
  };
}

function inferRuntimeStatus(progress) {
  const totalRequiredItems = progress.required_sections_total + progress.required_activities_total;
  const totalCompletedItems = progress.required_sections_completed + progress.required_activities_completed;

  if (totalCompletedItems === 0) {
    return 'not_started';
  }

  if (totalRequiredItems > 0 && totalCompletedItems >= totalRequiredItems) {
    return 'completed';
  }

  return 'in_progress';
}

function applyProgress(runtimeState, timestamp) {
  const progress = summarizeProgress(runtimeState);
  const status = inferRuntimeStatus(progress);
  runtimeState.runtime_state.progress = progress;
  runtimeState.runtime_state.status = status;
  runtimeState.runtime_state.updated_at = timestamp;
  runtimeState.runtime_state.completed_at = status === 'completed' ? runtimeState.runtime_state.completed_at || timestamp : null;
  return runtimeState;
}

function createRuntimeState(interactiveModule, options = {}) {
  const moduleRoot = ensureModuleRoot(interactiveModule);
  const timestamp = isoNow(options.now);
  const requiredSectionIds = new Set(moduleRoot.progress_hooks.required_sections || []);
  const requiredActivityIds = new Set(moduleRoot.progress_hooks.required_activities || []);
  const gradedActivityIds = new Set(moduleRoot.assessment_hooks.graded_activities || []);

  const runtimeState = {
    runtime_state: {
      module_id: moduleRoot.module_id,
      course_id: moduleRoot.course_id,
      week: moduleRoot.week,
      status: 'not_started',
      sections: moduleRoot.learning_flow.map((section) => ({
        section_id: section.section_id,
        section_type: section.section_type,
        required: requiredSectionIds.has(section.section_id),
        status: 'pending',
        completed_at: null
      })),
      activities: moduleRoot.activities.map((activity) => ({
        activity_id: activity.activity_id,
        type: activity.type,
        required: requiredActivityIds.has(activity.activity_id),
        graded: gradedActivityIds.has(activity.activity_id),
        status: 'pending',
        completed_at: null,
        latest_attempt_id: null,
        attempts: []
      })),
      evidence_hooks: clone(moduleRoot.evidence_hooks || {}),
      progress: {
        required_sections_total: 0,
        required_sections_completed: 0,
        required_activities_total: 0,
        required_activities_completed: 0,
        progress_percent: 0
      },
      created_at: timestamp,
      updated_at: timestamp,
      completed_at: null
    }
  };

  return applyProgress(runtimeState, timestamp);
}

function findSection(runtimeState, sectionId) {
  const section = runtimeState.runtime_state.sections.find((item) => item.section_id === sectionId);
  if (!section) {
    throw new Error(`Unknown section "${sectionId}".`);
  }
  return section;
}

function findActivity(runtimeState, activityId) {
  const activity = runtimeState.runtime_state.activities.find((item) => item.activity_id === activityId);
  if (!activity) {
    throw new Error(`Unknown activity "${activityId}".`);
  }
  return activity;
}

function markSectionCompleted(runtimeState, sectionId, options = {}) {
  const timestamp = isoNow(options.completedAt || options.now);
  const nextState = clone(runtimeState);
  const section = findSection(nextState, sectionId);

  section.status = 'completed';
  section.completed_at = section.completed_at || timestamp;

  return applyProgress(nextState, timestamp);
}

function markActivityCompleted(runtimeState, activityId, options = {}) {
  const timestamp = isoNow(options.completedAt || options.now);
  const nextState = clone(runtimeState);
  const activity = findActivity(nextState, activityId);

  activity.status = 'completed';
  activity.completed_at = activity.completed_at || timestamp;

  if (options.attemptId) {
    activity.latest_attempt_id = options.attemptId;
  }

  return applyProgress(nextState, timestamp);
}

function recordActivityAttempt(runtimeState, activityId, attemptInput = {}) {
  const timestamp = isoNow(attemptInput.submitted_at || attemptInput.now);
  const nextState = clone(runtimeState);
  const activity = findActivity(nextState, activityId);
  const attemptNumber = activity.attempts.length + 1;
  const attemptId = attemptInput.attempt_id || `${activityId}_attempt_${String(attemptNumber).padStart(2, '0')}`;
  const attempt = {
    attempt_id: attemptId,
    submitted_at: timestamp,
    status: attemptInput.status || 'submitted',
    response: attemptInput.response ?? null,
    notes: attemptInput.notes ?? null,
    evidence: Array.isArray(attemptInput.evidence) ? attemptInput.evidence.slice() : []
  };

  activity.attempts.push(attempt);
  activity.latest_attempt_id = attemptId;

  if (activity.status === 'pending') {
    activity.status = 'in_progress';
  }

  if (attemptInput.markComplete) {
    activity.status = 'completed';
    activity.completed_at = activity.completed_at || timestamp;
  }

  return applyProgress(nextState, timestamp);
}

function getRuntimeSummary(runtimeState) {
  const progress = runtimeState.runtime_state.progress;

  return {
    module_id: runtimeState.runtime_state.module_id,
    course_id: runtimeState.runtime_state.course_id,
    week: runtimeState.runtime_state.week,
    status: runtimeState.runtime_state.status,
    progress_percent: progress.progress_percent,
    required_sections_completed: progress.required_sections_completed,
    required_sections_total: progress.required_sections_total,
    required_activities_completed: progress.required_activities_completed,
    required_activities_total: progress.required_activities_total
  };
}

module.exports = {
  createRuntimeState,
  getRuntimeSummary,
  markActivityCompleted,
  markSectionCompleted,
  recordActivityAttempt
};
