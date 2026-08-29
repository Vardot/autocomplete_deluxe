/**
 * Compiles every assets/css/*.pcss.css source to the .css file beside it,
 * formatted with Prettier so the result is what CI's Stylelint expects.
 *
 * postcss-cli cannot do this on its own: --ext rewrites only the last
 * extension, so a *.pcss.css source would be written back over itself.
 *
 * Usage: yarn css:build
 */

/* eslint-disable import/no-unresolved, import/no-extraneous-dependencies */
const { readdirSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const postcss = require('postcss');
const prettier = require('prettier');

const config = require('../postcss.config');

const dir = join(__dirname, '..', 'assets', 'css');
const sources = readdirSync(dir).filter((name) => name.endsWith('.pcss.css'));

Promise.all(
  sources.map((name) => {
    const from = join(dir, name);
    const to = join(dir, name.replace(/\.pcss\.css$/, '.css'));
    return postcss(config.plugins)
      .process(readFileSync(from, 'utf8'), { from, to })
      .then((result) =>
        // Drupal core's Prettier settings for CSS, stated here rather than
        // resolved from a config file so the build matches CI exactly.
        prettier
          .format(result.css, {
            parser: 'css',
            printWidth: 10000,
            singleQuote: false,
          })
          .then((css) => {
            writeFileSync(to, css);
            process.stdout.write(
              `${name} -> ${name.replace(/\.pcss\.css$/, '.css')}\n`,
            );
          }),
      );
  }),
).catch((error) => {
  process.stderr.write(`${error}\n`);
  process.exitCode = 1;
});
