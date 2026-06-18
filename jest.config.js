/**
 * Root-level Jest config.
 *
 * Scoped to the root `tests/` directory on purpose: each workspace package
 * owns its own test runner (e.g. packages/api uses vitest). Without this
 * scope, Jest crawls the whole monorepo and fails on duplicate package names
 * and non-Jest package.json files (haste-map collisions), which previously
 * caused `npm test` to error silently behind `|| true`.
 */
module.exports = {
  testEnvironment: 'node',
  passWithNoTests: true,
  roots: ['<rootDir>/tests'],
  testPathIgnorePatterns: ['/node_modules/'],
  modulePathIgnorePatterns: ['<rootDir>/packages/']
};
