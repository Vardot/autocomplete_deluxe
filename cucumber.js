/* cspell:ignore webship artefacts */
// Default cucumber-js config for the Autocomplete Deluxe webship-js suite.
//
// Runs the Drupal Standard profile feature set (Gin admin theme) under
// tests/features/drupal/.
//
//   npx cucumber-js --config cucumber.js
//
// Reusable step definitions ship with webship-js; the module-specific steps
// live in tests/step-definitions/autocomplete_deluxe.steps.js. Artefacts land
// directly under tests/reports, tests/screenshots and tests/videos.

const baseWorldParameters = require('./cucumber.shared');

module.exports = {
  default: {
    timeout: 45000,
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',
      'tests/step-definitions/**/*.js',
    ],
    paths: ['tests/features/drupal/**/*.feature'],
    format: [
      '@cucumber/pretty-formatter',
      'json:tests/reports/cucumber_report.json',
    ],
    worldParameters: baseWorldParameters,
  },
};
