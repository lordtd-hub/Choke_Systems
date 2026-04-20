'use strict';

const { createRuntimeState } = require('../../tools/runtime-state');
const {
  fromRuntimeStatePayload,
  validateLearnerModuleStateRecord
} = require('../records/learner-module-state');
const { assertLearnerModuleStateRepository } = require('../repositories/learner-module-state-repository');
const {
  normalizeActivityCompletionCommand,
  normalizeModuleInitializationCommand,
  normalizeSectionCompletionCommand,
  touchActivityCompletion,
  touchSectionCompletion,
  applyDerivedState
} = require('./service-commands');

class LearningProgressService {
  constructor({ learnerModuleStateRepository, analyticsEventService = null }) {
    this.learnerModuleStateRepository = assertLearnerModuleStateRepository(learnerModuleStateRepository);
    this.analyticsEventService = analyticsEventService;
  }

  initializeModuleState(moduleContext) {
    const normalized = normalizeModuleInitializationCommand(moduleContext);
    const identity = {
      learner_key: normalized.learner_key,
      course_id: normalized.interactive_module.interactive_module.course_id,
      module_id: normalized.interactive_module.interactive_module.module_id,
      week: normalized.interactive_module.interactive_module.week
    };

    const existing = this.learnerModuleStateRepository.getByLearnerModule(identity);
    if (existing) {
      return existing;
    }

    const runtimeState = createRuntimeState(normalized.interactive_module, {
      now: normalized.now
    });
    const stateRecord = fromRuntimeStatePayload(runtimeState, {
      learner_key: normalized.learner_key
    });

    return this.learnerModuleStateRepository.saveCurrent(stateRecord);
  }

  getCurrentModuleState(identity) {
    return this.learnerModuleStateRepository.getByLearnerModule(identity);
  }

  completeSection(command) {
    const normalized = normalizeSectionCompletionCommand(command);
    const currentState = this.getCurrentModuleState(normalized);

    if (!currentState) {
      throw new Error('Cannot complete a section before module state is initialized.');
    }

    const nextState = this.learnerModuleStateRepository.saveCurrent(
      validateLearnerModuleStateRecord(touchSectionCompletion(currentState, normalized))
    );

    let analyticsEvent = null;
    if (this.analyticsEventService) {
      analyticsEvent = this.analyticsEventService.recordCompletionEvent({
        ...normalized,
        source_type: 'section',
        source_id: normalized.section_id,
        timestamp: normalized.completed_at,
        completion_status: 'completed',
        clo_ids: normalized.clo_ids
      });
    }

    return {
      learner_module_state: nextState,
      analytics_event_record: analyticsEvent
    };
  }

  completeActivity(command) {
    const normalized = normalizeActivityCompletionCommand(command);
    const currentState = this.getCurrentModuleState(normalized);

    if (!currentState) {
      throw new Error('Cannot complete an activity before module state is initialized.');
    }

    const nextState = this.learnerModuleStateRepository.saveCurrent(
      validateLearnerModuleStateRecord(touchActivityCompletion(currentState, normalized))
    );

    let analyticsEvent = null;
    if (this.analyticsEventService) {
      analyticsEvent = this.analyticsEventService.recordCompletionEvent({
        ...normalized,
        source_type: 'activity',
        source_id: normalized.activity_id,
        timestamp: normalized.completed_at,
        completion_status: 'completed',
        clo_ids: normalized.clo_ids
      });
    }

    return {
      learner_module_state: nextState,
      analytics_event_record: analyticsEvent
    };
  }

  recalculateProgress(identity) {
    const currentState = this.getCurrentModuleState(identity);

    if (!currentState) {
      throw new Error('Cannot recalculate progress before module state is initialized.');
    }

    return this.learnerModuleStateRepository.saveCurrent(
      validateLearnerModuleStateRecord(applyDerivedState(currentState, new Date().toISOString()))
    );
  }
}

module.exports = {
  LearningProgressService
};
