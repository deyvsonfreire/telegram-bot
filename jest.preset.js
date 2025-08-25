const { getJestProjects } = require('@nx/jest');

module.exports = {
  projects: getJestProjects(),
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
};
