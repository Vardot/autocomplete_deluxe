/* cspell:ignore webship webshare */
/* eslint-disable no-await-in-loop, no-restricted-syntax, import/no-unresolved */
/**
 * Browser steps drive one page, so the polling loops below have to await each
 * attempt in turn - running them in parallel would race the same page. The
 * import paths resolve at test time, when the suite's dependencies are
 * installed; the lint job runs without them.
 */
/**
 * @file
 * Custom step definitions for the Autocomplete Deluxe module test suite.
 *
 * Mirrors the sibling Webship modules (webshare / admin_audit_trail): the
 * generic login / navigation / named-selector helpers are copied verbatim so
 * login + navigation work, then a couple of module-specific assertions are
 * layered on top (the autocomplete-deluxe widget container, the Gin stylesheet
 * link). Navigation and waiting reuse webship-js's own helpers - gotoUrl
 * (friendly navigation errors) and waitForPageLoad (BBR smart-settle: DOM
 * ready, network idle, no pending AJAX/timers, DOM-quiet) - instead of raw
 * Playwright waits, and failures are wrapped with friendly().
 */

const { Given, Then, When } = require('@cucumber/cucumber');
const {
  friendly,
  gotoUrl,
  waitForPageLoad,
} = require('webship-js/tests/step-definitions/webship');

/**
 * Run a step body and rethrow any failure as a tester-friendly error.
 *
 * @param {Function} body  - async function performing the step.
 * @param {string} message - human-readable description for failures.
 */
async function attempt(body, message) {
  try {
    await body();
  } catch (err) {
    throw friendly(message, err);
  }
}

/**
 * Log in as a named test user defined in cucumber.js worldParameters.users.
 *
 * The Webmaster row is the site-install super-admin. Every other row is
 * provisioned by `Given I add testing users` (see below).
 *
 * Example #1: Given I am a logged in user with the "Webmaster" user
 * Example #2: Given I am a logged in user with the "Content editor" user
 * Example #3: Given I am a logged in user with the "Authenticated user" user
 * Example #4: Given I am a logged in user with the username "Content editor" user
 * Example #5: Given I am a logged in user with "Webmaster"
 */
Given(
  /^I am a logged in user with( the)*( username)* "([^"]*)?"( user)?$/,
  async function (theCase, usernameCase, key, userCase) {
    const users = this.parameters.users || {};
    if (!(key in users)) {
      throw new Error(
        `No user named "${key}" in cucumber.js worldParameters.users`,
      );
    }
    const { username, password } = users[key];
    if (!username || !password) {
      throw new Error(
        `User "${key}" is missing username or password in worldParameters.users`,
      );
    }
    await attempt(async () => {
      await this.context.clearCookies();
      await gotoUrl(this.page, `${this.parameters.launchUrl}/user/login`);
      // Use Drupal's stable field IDs so the step is theme-independent:
      // Olivero's label is "Username", the Gin theme renders "Username or email
      // address" - getByLabel('Username') is ambiguous.
      await this.page.locator('#edit-name').fill(username);
      await this.page.locator('#edit-pass').fill(password);
      await this.page.locator('input[value="Log in"]').click();
      await waitForPageLoad(
        this.page,
        this.minWaitTime && this.minWaitTime.page,
      );
    }, `Could not log in as "${key}"`);
  },
);

/**
 * Provision every non-admin user from cucumber.js worldParameters.users via
 * Drupal's /admin/people/create form. Entries flagged isAdmin: true are
 * skipped (the site-install Webmaster already exists). Idempotent.
 *
 * Example #1: Given I add testing users
 * Example #2: And I add testing users
 * Example #3: When I add testing users
 * Example #4: Given I add the testing users
 * Example #5: And we add testing users
 */
Given(/^(?:I |we )?add( the)? testing users$/, async function (theCase) {
  const users = this.parameters.users || {};
  await attempt(async () => {
    for (const [key, info] of Object.entries(users)) {
      if (info.isAdmin) continue;
      await gotoUrl(
        this.page,
        `${this.parameters.launchUrl}/admin/people/create`,
      );
      // Fill values + tick role checkboxes via JS. The Gin theme wraps the
      // password-confirm widget in an `is-initial` collapsed state that hides
      // the password inputs until an interaction event fires - a normal
      // Playwright fill() then fails actionability. Setting `.value` in the
      // page context bypasses the hidden-input check, and the form posts the
      // assigned values just the same.
      await this.page.evaluate((info) => {
        const set = (sel, val) => {
          const el = document.querySelector(sel);
          if (el) el.value = val;
        };
        set('#edit-name', info.username);
        set('#edit-mail', info.email || `${info.username}@example.test`);
        set('#edit-pass-pass1', info.password);
        set('#edit-pass-pass2', info.password);
        for (const role of info.roles || []) {
          const cb = document.querySelector(`input[name="roles[${role}]"]`);
          if (cb) cb.checked = true;
        }
      }, info);
      // JS-click sidesteps the Gin sticky form-actions overlay.
      await this.page.evaluate(() =>
        document.querySelector('#edit-submit').click(),
      );
      await waitForPageLoad(this.page);
    }
  }, 'Could not provision the testing users');
});

/**
 * Resolve a webship-js named selector from the world registry.
 *
 * The registry (`world.__selectorsCss`) is hydrated by webship-js from
 * `cucumber.shared.js`'s `selectors.files` list - see tests/selectors/*.json
 * for the catalog. Throws when the name is unknown so a typo never silently
 * passes through to Playwright as a literal CSS string.
 * @param world
 * @param name
 */
function resolveName(world, name) {
  const css = world.__selectorsCss || {};
  const key = name.trim();
  if (Object.prototype.hasOwnProperty.call(css, key)) {
    return css[key];
  }
  const keys = Object.keys(css);
  let best = null;
  let bestDistance = Infinity;
  for (const candidate of keys) {
    const distance = (function lev(a, b) {
      const m = a.length;
      const n = b.length;
      if (!m) return n;
      if (!n) return m;
      const row = new Array(n + 1);
      for (let j = 0; j <= n; j += 1) row[j] = j;
      for (let i = 1; i <= m; i += 1) {
        let prev = i;
        for (let j = 1; j <= n; j += 1) {
          const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
          const cur = Math.min(row[j] + 1, prev + 1, row[j - 1] + cost);
          row[j - 1] = prev;
          prev = cur;
        }
        row[n] = prev;
      }
      return row[n];
    })(key, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  const hint =
    best && bestDistance <= Math.max(4, Math.floor(key.length / 3))
      ? ` Did you mean "${best}"?`
      : '';
  throw new Error(
    `Unknown named selector "${key}".${hint} Run "Then print css selectors" to see all ${keys.length} registered names.`,
  );
}

/**
 * Assert a named selector is visible / hidden / attached / focused / enabled /
 * disabled / editable. Mirrors webship-js's raw-CSS `should be …` phrasing.
 *
 * Example #1: Then the "autocomplete deluxe widget" element should be visible
 * Example #2: Then the "autocomplete deluxe input" element should be visible within 5 seconds
 * Example #3: Then the "drupal admin error messages" element should be hidden
 */
Then(
  /^the "([^"]*)" element should be (visible|hidden|attached|focused|enabled|disabled|editable)(?: within (\d+) seconds?)?$/,
  async function (name, state, sec) {
    const sel = resolveName(this, name);
    const loc = this.page.locator(sel);
    const timeout = sec ? Number(sec) * 1000 : 10000;
    await attempt(async () => {
      if (state === 'visible' || state === 'attached') {
        await loc.first().waitFor({ state, timeout });
      } else if (state === 'hidden') {
        await loc.first().waitFor({ state: 'hidden', timeout });
      } else if (state === 'focused') {
        await this.page.waitForFunction(
          (s) => document.activeElement && document.activeElement.matches(s),
          sel,
          { timeout },
        );
      } else {
        const fn = {
          enabled: 'isEnabled',
          disabled: 'isDisabled',
          editable: 'isEditable',
        }[state];
        const ok = await loc.first()[fn]();
        if (!ok) throw new Error(`"${name}" not ${state}`);
      }
    }, `Expected "${name}" (${sel}) to be ${state}`);
  },
);

/**
 * Assert a named selector exists in the DOM (attached, regardless of
 * visibility). Useful for non-rendered nodes such as a stylesheet `<link>`,
 * which the browser keeps in `<head>` but never paints.
 *
 * Example #1: Then the "autocomplete deluxe gin stylesheet" element should exist
 * Example #2: Then the "autocomplete deluxe base stylesheet" element should exist
 * Example #3: And the "autocomplete deluxe widget" element should exist
 */
Then(
  /^the "([^"]*)" element should exist(?: within (\d+) seconds?)?$/,
  async function (name, sec) {
    const sel = resolveName(this, name);
    const timeout = sec ? Number(sec) * 1000 : 10000;
    await attempt(async () => {
      await this.page
        .locator(sel)
        .first()
        .waitFor({ state: 'attached', timeout });
    }, `Expected "${name}" (${sel}) to exist in the DOM`);
  },
);

/**
 * Assert the count of elements matching a named selector.
 *
 * Example #1: Then the "autocomplete deluxe widget" element should have a count of 1
 * Example #2: Then the "autocomplete deluxe gin stylesheet" element should have a count of 1
 */
Then(
  /^the "([^"]*)" element should have a count of (\d+)(?: within (\d+) seconds?)?$/,
  async function (name, expected, sec) {
    const sel = resolveName(this, name);
    const target = Number(expected);
    const timeout = sec ? Number(sec) * 1000 : 10000;
    const loc = this.page.locator(sel);
    const deadline = Date.now() + timeout;
    let last = -1;
    await attempt(async () => {
      while (Date.now() < deadline) {
        last = await loc.count();
        if (last === target) return;
        await this.page.waitForTimeout(100);
      }
      throw new Error(`count was ${last}`);
    }, `Expected "${name}" (${sel}) count to be ${target}`);
  },
);

/**
 * Click the first element matching a named selector. Falls back to a JS
 * `.click()` after a failed Playwright actionability retry so Gin's sticky
 * form-actions overlay does not stall the click.
 *
 * Example #1: When I click the "autocomplete deluxe input" element
 * Example #2: When I click on the "autocomplete deluxe widget" element
 */
When(
  /^(?:I |we )?click(?: on)?(?: the)? "([^"]*)" element$/,
  async function (name) {
    const sel = resolveName(this, name);
    await attempt(async () => {
      const loc = this.page.locator(sel).first();
      await loc.waitFor({ state: 'visible', timeout: 10000 });
      try {
        await loc.click({ timeout: 4000 });
      } catch (e) {
        await this.page.evaluate((s) => {
          const el = document.querySelector(s);
          if (el) el.click();
        }, sel);
      }
    }, `Could not click the "${name}" element`);
  },
);

/* -------------------------------------------------------------------------- *
 * Autocomplete Deluxe widget interactions.
 *
 * The widget is a jQuery-UI autocomplete: typing in `input.autocomplete-deluxe-form`
 * queries the server and renders an `ul.ui-autocomplete` menu of `li.ui-menu-item`
 * entries. Selecting an entry appends a `.autocomplete-deluxe-item` "chip" (each
 * with an `.autocomplete-deluxe-item-delete` control). The page renders TWO
 * `ul.ui-autocomplete` nodes (one inert placeholder, one live), so every menu
 * query is scoped with the `:visible` pseudo-class to target the live one.
 * Selecting / deleting is followed by webship-js's BBR smart-settle, so no
 * manual AJAX waits are required after these steps.
 * -------------------------------------------------------------------------- */

const ACD_INPUT = 'input.autocomplete-deluxe-form';
const ACD_VISIBLE_ITEM = 'ul.ui-autocomplete:visible li.ui-menu-item';
const ACD_CHIP = '.autocomplete-deluxe-item';

/**
 * Focus the widget input reliably. The Drupal admin toolbar tray can overlap
 * the field at narrow viewports, so a failed Playwright click falls back to a
 * JS focus(); the field is then cleared ready for typing.
 *
 * @param {import('playwright').Page} page
 * @return {Promise<import('playwright').Locator>}
 */
async function focusAcdInput(page) {
  const input = page.locator(ACD_INPUT).first();
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.scrollIntoViewIfNeeded().catch(() => {});
  try {
    await input.click({ timeout: 4000 });
  } catch (e) {
    await input.evaluate((el) => el.focus());
  }
  await input.fill('');
  return input;
}

/**
 * Type a query into the Autocomplete Deluxe text field. Uses real keyboard
 * events (not fill) so jQuery UI's keydown-driven search fires.
 *
 * Example #1: When I type "Alpha" into the autocomplete deluxe field
 * Example #2: When I type "Be" into the autocomplete deluxe field
 * Example #3: And we type "Gamma" into the autocomplete deluxe field
 */
When(
  /^(?:I |we )?type "([^"]*)" into the autocomplete deluxe field$/,
  async function (query) {
    await attempt(async () => {
      await focusAcdInput(this.page);
      await this.page.keyboard.type(query, { delay: 90 });
    }, `Could not type "${query}" into the autocomplete deluxe field`);
  },
);

/**
 * Assert the live suggestion menu becomes visible (auto-waits, no sleep).
 *
 * Example #1: Then the autocomplete deluxe suggestion list should appear
 * Example #2: Then the autocomplete deluxe suggestion list should appear within 8 seconds
 */
Then(
  /^the autocomplete deluxe suggestion list should appear(?: within (\d+) seconds?)?$/,
  async function (sec) {
    const timeout = sec ? Number(sec) * 1000 : 10000;
    await attempt(async () => {
      await this.page
        .locator(ACD_VISIBLE_ITEM)
        .first()
        .waitFor({ state: 'visible', timeout });
    }, 'Expected the autocomplete deluxe suggestion list to appear');
  },
);

/**
 * Assert the live suggestion menu offers no committable result (used for the
 * no-match path where new_terms / not_found_message are disabled).
 *
 * Example #1: Then the autocomplete deluxe suggestion list should offer no results
 * Example #2: Then the autocomplete deluxe suggestion list should offer no results within 5 seconds
 */
Then(
  /^the autocomplete deluxe suggestion list should offer no results(?: within (\d+) seconds?)?$/,
  async function (sec) {
    const timeout = sec ? Number(sec) * 1000 : 6000;
    await attempt(async () => {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        const visible = await this.page.locator(ACD_VISIBLE_ITEM).count();
        if (visible === 0) return;
        await this.page.waitForTimeout(150);
      }
      const remaining = await this.page
        .locator(ACD_VISIBLE_ITEM)
        .allTextContents();
      throw new Error(`menu still offered: ${JSON.stringify(remaining)}`);
    }, 'Expected the autocomplete deluxe suggestion list to offer no results');
  },
);

/**
 * Select a suggestion from the live menu by its visible text. jQuery UI sorts
 * the menu and a CONTAINS match can surface several items, so matching by text
 * (not position) keeps the step deterministic.
 *
 * Example #1: When I select "Alpha" from the autocomplete deluxe suggestions
 * Example #2: When I select "Gamma" from the autocomplete deluxe suggestions
 * Example #3: And we select "Delta" from the autocomplete deluxe suggestions
 */
When(
  /^(?:I |we )?select "([^"]*)" from the autocomplete deluxe suggestions$/,
  async function (label) {
    await attempt(async () => {
      const option = this.page
        .locator(ACD_VISIBLE_ITEM, { hasText: label })
        .first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();
      await this.page
        .locator(ACD_CHIP, { hasText: label })
        .first()
        .waitFor({ state: 'attached', timeout: 8000 });
    }, `Could not select "${label}" from the autocomplete deluxe suggestions`);
  },
);

/**
 * Type a query, wait for the matching suggestion and select it in one step
 * (the common "add a tag" flow).
 *
 * Example #1: When I add the autocomplete deluxe tag "Alpha"
 * Example #2: When I add the autocomplete deluxe tag "Beta"
 * Example #3: And we add the autocomplete deluxe tag "Gamma"
 */
When(
  /^(?:I |we )?add the autocomplete deluxe tag "([^"]*)"$/,
  async function (label) {
    await attempt(async () => {
      await focusAcdInput(this.page);
      await this.page.keyboard.type(label, { delay: 90 });
      const option = this.page
        .locator(ACD_VISIBLE_ITEM, { hasText: label })
        .first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      try {
        await option.click({ timeout: 4000 });
      } catch (e) {
        await option.evaluate((el) => el.click());
      }
      await this.page
        .locator(ACD_CHIP, { hasText: label })
        .first()
        .waitFor({ state: 'attached', timeout: 8000 });
    }, `Could not add the autocomplete deluxe tag "${label}"`);
  },
);

/**
 * Assert a selected chip with the given label is / is not present.
 *
 * Example #1: Then I should see the autocomplete deluxe tag "Alpha"
 * Example #2: Then I should not see the autocomplete deluxe tag "Beta"
 * Example #3: And we should see the autocomplete deluxe tag "Gamma"
 */
Then(
  /^(?:I |we )?should( not)? see the autocomplete deluxe tag "([^"]*)"$/,
  async function (negate, label) {
    await attempt(
      async () => {
        const chip = this.page.locator(ACD_CHIP, { hasText: label });
        if (negate) {
          await chip.first().waitFor({ state: 'detached', timeout: 8000 });
        } else {
          await chip.first().waitFor({ state: 'attached', timeout: 8000 });
        }
      },
      `Expected the autocomplete deluxe tag "${label}" to ${negate ? 'be absent' : 'be present'}`,
    );
  },
);

/**
 * Assert how many chips are currently selected.
 *
 * Example #1: Then there should be 2 autocomplete deluxe tags
 * Example #2: Then there should be 1 autocomplete deluxe tag
 * Example #3: And there should be 0 autocomplete deluxe tags
 */
Then(
  /^there should be (\d+) autocomplete deluxe tags?$/,
  async function (count) {
    const target = Number(count);
    await attempt(async () => {
      const deadline = Date.now() + 8000;
      let last = -1;
      while (Date.now() < deadline) {
        last = await this.page.locator(ACD_CHIP).count();
        if (last === target) return;
        await this.page.waitForTimeout(120);
      }
      throw new Error(`found ${last}`);
    }, `Expected ${target} autocomplete deluxe tag(s)`);
  },
);

/**
 * Remove a selected chip by clicking its delete control, matched by label.
 *
 * Example #1: When I remove the autocomplete deluxe tag "Alpha"
 * Example #2: When I remove the autocomplete deluxe tag "Beta"
 * Example #3: And we remove the autocomplete deluxe tag "Gamma"
 */
When(
  /^(?:I |we )?remove the autocomplete deluxe tag "([^"]*)"$/,
  async function (label) {
    await attempt(async () => {
      const chip = this.page.locator(ACD_CHIP, { hasText: label }).first();
      await chip.waitFor({ state: 'visible', timeout: 8000 });
      const del = chip.locator('.autocomplete-deluxe-item-delete');
      try {
        await del.click({ timeout: 4000 });
      } catch (e) {
        await del.evaluate((el) => el.click());
      }
      await chip.waitFor({ state: 'detached', timeout: 8000 });
    }, `Could not remove the autocomplete deluxe tag "${label}"`);
  },
);

/**
 * Remove a tag with a touch tap rather than a mouse click.
 *
 * A touch browser does not always send a mouse event for a tap, so the widget
 * has to listen for touchstart as well. Dispatching the event by name exercises
 * that listener in any browser: with a mousedown-only handler nothing happens
 * and the tag stays, which is the failure this covers.
 *
 * Example: When I tap the delete control of the autocomplete deluxe tag "Alpha"
 */
When(
  /^(?:I |we )?tap the delete control of the autocomplete deluxe tag "([^"]*)"$/,
  async function (label) {
    await attempt(async () => {
      const chip = this.page.locator(ACD_CHIP, { hasText: label }).first();
      await chip.waitFor({ state: 'visible', timeout: 8000 });
      await chip
        .locator('.autocomplete-deluxe-item-delete')
        .evaluate((el) =>
          el.dispatchEvent(
            new Event('touchstart', { bubbles: true, cancelable: true }),
          ),
        );
      await chip.waitFor({ state: 'detached', timeout: 8000 });
    }, `Tapping the delete control of "${label}" did not remove it`);
  },
);

/**
 * Assert the delete control offers a target a finger can hit.
 *
 * The icon is deliberately small, so on a coarse pointer the widget grows the
 * tap area with a pseudo element sized from the admin theme's spacing scale.
 * A desktop browser reports a fine pointer and would never apply the rule, so
 * the declared value is resolved against the page rather than measured.
 *
 * Example: Then the autocomplete deluxe delete control should offer a tap
 *          target of at least 44 pixels on a coarse pointer
 */
Then(
  /^the autocomplete deluxe delete control should offer a tap target of at least (\d+) pixels on a coarse pointer$/,
  async function (min) {
    await attempt(async () => {
      const found = await this.page.evaluate(() => {
        // Read what the coarse-pointer block declares: the tap-target custom
        // property if the rule uses one, otherwise a plain width.
        let token = null;
        let width = null;
        for (const sheet of Array.from(document.styleSheets)) {
          let rules;
          try {
            rules = sheet.cssRules;
          } catch (e) {
            continue;
          }
          for (const rule of Array.from(rules || [])) {
            const media =
              rule.conditionText || (rule.media && rule.media.mediaText);
            if (!media || !/pointer:\s*coarse/.test(media)) {
              continue;
            }
            for (const inner of Array.from(rule.cssRules || [])) {
              if (
                !/autocomplete-deluxe-item-delete/.test(
                  inner.selectorText || '',
                )
              ) {
                continue;
              }
              const t = inner.style.getPropertyValue(
                '--autocomplete-deluxe-tap-target',
              );
              if (t && !token) {
                token = t.trim();
              }
              if (inner.style.width && !width) {
                width = inner.style.width.trim();
              }
            }
          }
        }
        const declared = token || width;
        if (!declared) {
          return null;
        }
        // Resolve it against the element the rule applies to, so a var() chain
        // picks up whichever token the active admin theme provides.
        const host =
          document.querySelector('.autocomplete-deluxe-item-delete') ||
          document.body;
        const probe = document.createElement('div');
        probe.style.position = 'absolute';
        probe.style.visibility = 'hidden';
        probe.style.width = declared;
        host.appendChild(probe);
        const resolved = parseFloat(getComputedStyle(probe).width);
        probe.remove();
        return { declared, resolved };
      });
      const wanted = parseInt(min, 10);
      if (!found) {
        throw new Error(
          'No coarse-pointer rule grows the delete control tap area',
        );
      }
      if (!(found.resolved >= wanted)) {
        throw new Error(
          `Coarse-pointer tap target resolves to ${found.resolved}px from "${found.declared}", wanted at least ${wanted}px`,
        );
      }
    }, 'Could not read the coarse-pointer rule for the delete control');
  },
);

/**
 * Add a value through the widget handle other code is meant to use.
 *
 * The point of the handle is that a module can drive the widget from its own
 * JavaScript, so the step goes through exactly the documented route:
 * jQuery("#the-input").data("autocompleteDeluxe").addValue(item).
 *
 * Example: When I add "Alpha (1)" through the autocomplete deluxe widget handle
 */
When(
  /^(?:I |we )?add "([^"]*)" through the autocomplete deluxe widget handle$/,
  async function (value) {
    await attempt(async () => {
      const outcome = await this.page.evaluate((value) => {
        const input = document.querySelector('#autocomplete-deluxe-input');
        if (!input || !window.jQuery) {
          return 'no input or no jQuery';
        }
        const widget = window.jQuery(input).data('autocompleteDeluxe');
        if (!widget) {
          return 'no handle on the input';
        }
        if (typeof widget.addValue !== 'function') {
          return 'the handle carries no addValue';
        }
        widget.addValue({ label: value, value });
        return 'added';
      }, value);
      if (outcome !== 'added') {
        throw new Error(outcome);
      }
    }, `Could not add "${value}" through the widget handle`);
  },
);

/**
 * Commit the current Autocomplete Deluxe input with Enter. With new_terms /
 * not_found_message disabled, an unmatched value must NOT produce a chip - this
 * step lets a scenario exercise that boundary deterministically.
 *
 * Example #1: When I commit the autocomplete deluxe input with Enter
 * Example #2: And we commit the autocomplete deluxe input with Enter
 */
When(
  /^(?:I |we )?commit the autocomplete deluxe input with Enter$/,
  async function () {
    await attempt(async () => {
      const input = this.page.locator(ACD_INPUT).first();
      await input.focus();
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(400);
    }, 'Could not commit the autocomplete deluxe input with Enter');
  },
);

/**
 * Highlight the next suggestion in the live menu with the Down arrow, mirroring
 * keyboard-only navigation.
 *
 * Example #1: When I press the down arrow in the autocomplete deluxe field
 * Example #2: And we press the down arrow in the autocomplete deluxe field
 */
When(
  /^(?:I |we )?press the down arrow in the autocomplete deluxe field$/,
  async function () {
    await attempt(async () => {
      await this.page.locator(ACD_INPUT).first().focus();
      await this.page.keyboard.press('ArrowDown');
    }, 'Could not press the down arrow in the autocomplete deluxe field');
  },
);

/**
 * Press Backspace in the widget input. On an empty input the widget marks the
 * last chip, and a second press removes it, so a scenario spells out one press
 * per step.
 *
 * Example #1: When I press Backspace in the autocomplete deluxe field
 * Example #2: And we press Backspace in the autocomplete deluxe field
 * @param page
 */
async function clickDrupalSubmit(page) {
  const sticky = page.locator('#gin-sticky-edit-submit');
  if (await sticky.count()) {
    try {
      await sticky.click({ timeout: 5000 });
      return;
    } catch (e) {
      /* fall through */
    }
  }
  const submit = page.locator('#edit-submit');
  try {
    await submit.click({ timeout: 5000 });
  } catch (e) {
    await page.evaluate(() => {
      const el =
        document.querySelector('#gin-sticky-edit-submit') ||
        document.querySelector('#edit-submit');
      if (el) el.click();
    });
  }
}

When(
  /^(?:I |we )?press Backspace in the autocomplete deluxe field$/,
  async function () {
    await attempt(async () => {
      await this.page.locator(ACD_INPUT).first().focus();
      await this.page.keyboard.press('Backspace');
      await this.page.waitForTimeout(300);
    }, 'Could not press Backspace in the autocomplete deluxe field');
  },
);

/**
 * Assert whether a chip carries the pending-removal marking the widget applies
 * on the first Backspace (`.autocomplete-deluxe-item-focus`).
 *
 * Example #1: Then the autocomplete deluxe tag "Beta" should be marked for removal
 * Example #2: Then the autocomplete deluxe tag "Beta" should not be marked for removal
 * Example #3: And the autocomplete deluxe tag "Gamma" should be marked for removal
 */
Then(
  /^the autocomplete deluxe tag "([^"]*)" should( not)? be marked for removal$/,
  async function (label, negate) {
    await attempt(
      async () => {
        const chip = this.page.locator(ACD_CHIP, { hasText: label }).first();
        await chip.waitFor({ state: 'attached', timeout: 8000 });
        const deadline = Date.now() + 5000;
        let marked = null;
        while (Date.now() < deadline) {
          marked = await chip.evaluate((el) =>
            el.classList.contains('autocomplete-deluxe-item-focus'),
          );
          if (marked === !negate) return;
          await this.page.waitForTimeout(120);
        }
        throw new Error(`marked was ${marked}`);
      },
      `Expected the autocomplete deluxe tag "${label}" to ${negate ? 'not ' : ''}be marked for removal`,
    );
  },
);

/**
 * Assert the widget input holds no text - the state the widget must return to
 * after it discards a value it refuses to commit.
 *
 * Example #1: Then the autocomplete deluxe field should be empty
 * Example #2: And the autocomplete deluxe field should be empty
 */
Then(/^the autocomplete deluxe field should be empty$/, async function () {
  await attempt(async () => {
    const input = this.page.locator(ACD_INPUT).first();
    const deadline = Date.now() + 5000;
    let value = null;
    while (Date.now() < deadline) {
      value = await input.inputValue();
      if (value === '') return;
      await this.page.waitForTimeout(120);
    }
    throw new Error(`value was ${JSON.stringify(value)}`);
  }, 'Expected the autocomplete deluxe field to be empty');
});

/* -------------------------------------------------------------------------- *
 * Drupal admin helpers (theme-agnostic, Gin-sticky aware).
 * -------------------------------------------------------------------------- */

/**
 * Create a taxonomy term in a vocabulary through the admin UI. Idempotent
 * enough for a setup feature: re-running adds duplicates, which the autocomplete
 * tolerates, but the suite seeds each name once.
 *
 * Example #1: Given I create the taxonomy term "Alpha" in the "acd_tags" vocabulary
 * Example #2: And I create the taxonomy term "Beta" in the "acd_tags" vocabulary
 * Example #3: When we create the taxonomy term "Gamma" in the "acd_tags" vocabulary
 */
Given(
  /^(?:I |we )?create the taxonomy term "([^"]*)" in the "([^"]*)" vocabulary$/,
  async function (term, vocabulary) {
    await attempt(async () => {
      await gotoUrl(
        this.page,
        `${this.parameters.launchUrl}/admin/structure/taxonomy/manage/${vocabulary}/add`,
      );
      await this.page.locator('#edit-name-0-value').fill(term);
      await clickDrupalSubmit(this.page);
      await waitForPageLoad(
        this.page,
        this.minWaitTime && this.minWaitTime.page,
      );
    }, `Could not create the taxonomy term "${term}" in "${vocabulary}"`);
  },
);

/**
 * Save the current Drupal entity form. Gin syncs the real submit to a visible
 * `#gin-sticky-edit-submit`; Claro / Default Admin expose `#edit-submit`. This
 * step clicks whichever is actionable and waits for the post-save page.
 *
 * Example #1: When I save the form
 * Example #2: And we save the form
 * Example #3: When I save the content
 */
When(/^(?:I |we )?save the (?:form|content|node)$/, async function () {
  await attempt(async () => {
    await clickDrupalSubmit(this.page);
    await waitForPageLoad(this.page, this.minWaitTime && this.minWaitTime.page);
  }, 'Could not save the form');
});

/**
 * Open the edit form of the node currently being viewed. After a save the
 * browser lands on /node/N; this re-opens /node/N/edit so the persisted widget
 * value can be asserted (the test content type hides the field on its view
 * display, so the edit form is the deterministic place to verify persistence).
 *
 * Example #1: When I open the edit form of the current node
 * Example #2: And we open the edit form of the current node
 */
When(/^(?:I |we )?open the edit form of the current node$/, async function () {
  await attempt(async () => {
    const url = this.page.url();
    const match = url.match(/\/node\/(\d+)(?:\/|$|\?)/);
    if (!match) {
      throw new Error(`current URL "${url}" is not a node page`);
    }
    await gotoUrl(
      this.page,
      `${this.parameters.launchUrl}/node/${match[1]}/edit`,
    );
    await waitForPageLoad(this.page, this.minWaitTime && this.minWaitTime.page);
  }, 'Could not open the edit form of the current node');
});

/**
 * Click the form's primary submit, preferring the visible Gin sticky button and
 * falling back to the canonical `#edit-submit` (Claro / Default Admin) with a
 * final JS click for sticky-overlay intercepts.
 *
 * @param {import('playwright').Page} page
 */
