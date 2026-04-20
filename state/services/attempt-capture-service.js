'use strict';

const { createAttemptRecord } = require('../records/attempt-record');
const { assertAttemptRecordRepository } = require('../repositories/attempt-record-repository');
const { assertLearnerModuleStateRepository } = require('../repositories/learner-module-state-repository');
const {
  normalizeAttemptCommand,
  touchAttemptCapture,
  validateLearnerModuleStateRecord
} = (() => {
  const serviceCommands = require('./service-commands');
  const { validateLearnerModuleStateRecord } = require('../records/learner-module-state');
  return { ...serviceCommands, validateLearnerModuleStateRecord };
})();

class AttemptCaptureService {
  constructor({ attemptRecordRepository, learnerModuleStateRepository }) {
    this.attemptRecordRepository = assertAttemptRecordRepository(attemptRecordRepository);
    this.learnerModuleStateRepository = assertLearnerModuleStateRepository(learnerModuleStateRepository);
  }

  recordAttempt(command) {
    const normalized = normalizeAttemptCommand(command);
    const currentState = this.learnerModuleStateRepository.getByLearnerModule(normalized);

    if (!currentState) {
      throw new Error('Cannot record an attempt before module state is initialized.');
    }

    const existingAttempts = this.attemptRecordRepository.listByActivity(normalized);
    const attemptRecord = createAttemptRecord({
      ...normalized,
      attempt_no: existingAttempts.length + 1
    });

    this.attemptRecordRepository.append(attemptRecord);

    const reloadedState = this.learnerModuleStateRepository.getByLearnerModule(normalized);
    const nextState = this.learnerModuleStateRepository.saveCurrent(
      validateLearnerModuleStateRecord(touchAttemptCapture(reloadedState, normalized, attemptRecord))
    );

    return {
      attempt_record: attemptRecord,
      learner_module_state: nextState
    };
  }

  getAttempt(attemptId) {
    return this.attemptRecordRepository.getById(attemptId);
  }

  listAttempts(activityScope) {
    return this.attemptRecordRepository.listByActivity(activityScope);
  }
}

module.exports = {
  AttemptCaptureService
};
