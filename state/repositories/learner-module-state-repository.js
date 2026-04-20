'use strict';

const REQUIRED_METHODS = ['getByLearnerModule', 'saveCurrent', 'exists'];

class LearnerModuleStateRepository {
  getByLearnerModule() {
    throw new Error('LearnerModuleStateRepository.getByLearnerModule must be implemented.');
  }

  saveCurrent() {
    throw new Error('LearnerModuleStateRepository.saveCurrent must be implemented.');
  }

  exists() {
    throw new Error('LearnerModuleStateRepository.exists must be implemented.');
  }
}

function assertLearnerModuleStateRepository(repository) {
  REQUIRED_METHODS.forEach((methodName) => {
    if (!repository || typeof repository[methodName] !== 'function') {
      throw new Error(`LearnerModuleStateRepository must implement ${methodName}().`);
    }
  });

  return repository;
}

module.exports = {
  LearnerModuleStateRepository,
  REQUIRED_METHODS,
  assertLearnerModuleStateRepository
};
