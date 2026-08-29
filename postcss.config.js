/**
 * PostCSS build for the module stylesheets, following Drupal core (Claro)
 * and the Gin theme: modern CSS in *.pcss.css, compiled beside it.
 *
 * Run locally with `yarn css:build`. CI never runs it and installs only
 * core's node modules, so these two plugins resolve on a developer's
 * machine and nowhere else.
 */

/* eslint-disable import/no-unresolved, import/no-extraneous-dependencies */
const postcssImport = require('postcss-import');
const postcssPresetEnv = require('postcss-preset-env');

module.exports = {
  plugins: [
    postcssImport(),
    postcssPresetEnv({
      stage: 1,
      features: {
        'nesting-rules': true,
        // Drupal supports right-to-left languages, so logical properties must
        // survive the build rather than being rewritten to left and right.
        'logical-properties-and-values': false,
        // Custom properties are read at runtime; the theme overrides them.
        'custom-properties': false,
      },
    }),
  ],
};
