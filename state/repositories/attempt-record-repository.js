'use strict';

const REQUIRED_METHODS = ['append', 'getById', 'listByLearnerModule', 'listByActivity'];

class AttemptRecordRepository {
  append() {
    throw new Error('AttemptRecordRepository.append must be implemented.');
  }

  getById() {
    throw new Error('AttemptRecordRepository.getById must be implemented.');
  }

  listByLearnerModule() {
    throw new Error('AttemptRecordRepository.listByLearnerModule must be implemented.');
  }

  listByActivity() {
    throw new Error('AttemptRecordRepository.listByActivity must be implemented.');
  }
}

function assertAttemptRecordRepository(repository) {
  REQUIRED_METHODS.forEach((methodName) => {
    if (!repository || typeof repository[methodName] !== 'function') {
      throw new Error(`AttemptRecordRepository must implement ${methodName}().`);
    }
  });

  return repository;
}

module.exports = {
  AttemptRecordRepository,
  REQUIRED_METHODS,
  assertAttemptRecordRepository
};
