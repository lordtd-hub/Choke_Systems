'use strict';

const REQUIRED_METHODS = ['append', 'getById', 'listByLearnerModule', 'listByAttempt', 'listByActivity'];

class AssessmentResultRepository {
  append() {
    throw new Error('AssessmentResultRepository.append must be implemented.');
  }

  getById() {
    throw new Error('AssessmentResultRepository.getById must be implemented.');
  }

  listByLearnerModule() {
    throw new Error('AssessmentResultRepository.listByLearnerModule must be implemented.');
  }

  listByAttempt() {
    throw new Error('AssessmentResultRepository.listByAttempt must be implemented.');
  }

  listByActivity() {
    throw new Error('AssessmentResultRepository.listByActivity must be implemented.');
  }
}

function assertAssessmentResultRepository(repository) {
  REQUIRED_METHODS.forEach((methodName) => {
    if (!repository || typeof repository[methodName] !== 'function') {
      throw new Error(`AssessmentResultRepository must implement ${methodName}().`);
    }
  });

  return repository;
}

module.exports = {
  AssessmentResultRepository,
  REQUIRED_METHODS,
  assertAssessmentResultRepository
};
