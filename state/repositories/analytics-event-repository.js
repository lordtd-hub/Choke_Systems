'use strict';

const REQUIRED_METHODS = ['append', 'appendMany', 'getById', 'listByLearnerModule', 'listByLearnerWeek', 'listBySource'];

class AnalyticsEventRepository {
  append() {
    throw new Error('AnalyticsEventRepository.append must be implemented.');
  }

  appendMany() {
    throw new Error('AnalyticsEventRepository.appendMany must be implemented.');
  }

  getById() {
    throw new Error('AnalyticsEventRepository.getById must be implemented.');
  }

  listByLearnerModule() {
    throw new Error('AnalyticsEventRepository.listByLearnerModule must be implemented.');
  }

  listByLearnerWeek() {
    throw new Error('AnalyticsEventRepository.listByLearnerWeek must be implemented.');
  }

  listBySource() {
    throw new Error('AnalyticsEventRepository.listBySource must be implemented.');
  }
}

function assertAnalyticsEventRepository(repository) {
  REQUIRED_METHODS.forEach((methodName) => {
    if (!repository || typeof repository[methodName] !== 'function') {
      throw new Error(`AnalyticsEventRepository must implement ${methodName}().`);
    }
  });

  return repository;
}

module.exports = {
  AnalyticsEventRepository,
  REQUIRED_METHODS,
  assertAnalyticsEventRepository
};
