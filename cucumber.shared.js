/* cspell:ignore webship webshare */
// Shared cucumber-js worldParameters for the Autocomplete Deluxe suite.
//
// `cucumber.js` imports this and layers its own report / screenshot / video
// paths on top, mirroring the sibling Webship modules (webshare /
// admin_audit_trail).

module.exports = {
  launchUrl: process.env.LAUNCH_URL || 'http://localhost',
  // Test users for each Drupal Standard profile role.
  //
  // The Webmaster row is the `drush site:install` super-admin (or, on a
  // pre-built site, the `webmaster` account created via
  // `ddev drush user:create webmaster --password=dD.123123ddd` +
  // `ddev drush user:role:add administrator webmaster`).
  users: {
    Webmaster: {
      username: 'webmaster',
      email: 'webmaster@example.test',
      password: 'dD.123123ddd',
      isAdmin: true,
    },
    // May write the field but may not create taxonomy terms, so the widget has
    // to stop offering new values to them.
    Tagger: {
      username: 'acd_tagger',
      email: 'acd_tagger@example.test',
      password: 'dD.123123ddd',
      roles: ['acd_tagger'],
      isAdmin: false,
    },
  },
  minWaitTime: {
    page: 3000,
    before_scenario: 0,
    after_scenario: 0,
    before_step: 0,
    after_step: 0,
  },
  selectors: {
    css: {},
    xpath: {},
    filesPath: './tests/selectors/',
    files: ['cms-drupal-core-claro.json', 'autocomplete_deluxe.json'],
    offset: 60,
    breakpoints: {
      xs: { width: 375, height: 667 },
      sm: { width: 576, height: 800 },
      md: { width: 768, height: 1024 },
      lg: { width: 992, height: 768 },
      xl: { width: 1200, height: 900, default: true },
      xxl: { width: 1400, height: 900 },
    },
  },
  screenshot: {
    dir: './tests/screenshots',
    purge: false,
    onFailed: true,
    onEveryStep: false,
    alwaysFullscreen: false,
    failedPrefix: 'failed_',
    filenamePattern: '{datetime}.{feature_file}.feature_{step_line}.{ext}',
    filenamePatternFailed:
      '{failed_prefix}{datetime}.{feature_file}.feature_{step_line}.{ext}',
    infoTypes: '',
  },
  video: {
    mode: 'on-failure',
    dir: './tests/videos',
    size: { width: 1280, height: 720 },
    filenamePattern: '{datetime}.{feature_file}.{scenario}.{status}.{ext}',
  },
  javascript: {
    mode: 'warn',
    levels: ['error'],
    ignore: '',
    beforeScenario: false,
    afterScenario: true,
  },
};
