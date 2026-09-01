/**
 * @file:
 * Converts textfield to an Autocomplete Deluxe widget.
 */

(($, Drupal, once, drupalSettings, Sortable) => {
  Drupal.autocomplete_deluxe = Drupal.autocomplete_deluxe || {};

  Drupal.behaviors.autocomplete_deluxe = {
    attach(context) {
      const autocompleteSettings = drupalSettings.autocomplete_deluxe;

      const $elements = $(
        once(
          'attachAutocompleteDeluxe',
          'input.autocomplete-deluxe-form',
          context,
        ),
      );

      $elements.each(function () {
        const widget = new Drupal.autocomplete_deluxe.MultipleWidget(
          this,
          autocompleteSettings[$(this).attr('id')],
        );
        // Keep the widget on the input, so other code can reach it, as in
        // jQuery("#the-input").data("autocompleteDeluxe").addValue(item).
        $(this).data('autocompleteDeluxe', widget);
      });
    },
  };

  /**
   * Autogrow plugin which auto resizes the input of the multiple value.
   *
   * http://stackoverflow.com/questions/931207/is-there-a-jquery-autogrow-plugin-for-text-fields
   *
   * @param {Object}
   *   An object.
   * @return {Object}
   *   The auto grow input.
   */
  $.fn.autoGrowInput = function (o) {
    o = $.extend(
      {
        maxWidth: 1000,
        minWidth: 0,
        comfortZone: 70,
      },
      o,
    );

    this.filter('input:text').each(function () {
      const minWidth = o.minWidth || $(this).width();
      let val = '';
      const input = $(this);
      const inputStyle = window.getComputedStyle(input[0]);

      const testSubjectEl = document.createElement('tester');

      testSubjectEl.style.position = 'absolute';
      testSubjectEl.style.top = '-9999px';
      testSubjectEl.style.left = '-9999px';
      testSubjectEl.style.width = 'auto';
      testSubjectEl.style.fontSize = inputStyle.fontSize;
      testSubjectEl.style.fontFamily = inputStyle.fontFamily;
      testSubjectEl.style.fontWeight = inputStyle.fontWeight;
      testSubjectEl.style.letterSpacing = inputStyle.letterSpacing;
      testSubjectEl.style.whiteSpace = 'nowrap';

      const testSubject = $(testSubjectEl);

      const check = function () {
        val = input.val();
        if (val === input.val()) {
          return;
        }

        // Enter new content into testSubject.
        const escaped = val
          .replace(/&/g, '&amp;')
          .replace(/\s/g, '&nbsp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        testSubject.html(escaped);

        // Calculate new width + whether to change.
        const testerWidth = testSubject.width();
        const newWidth =
          testerWidth + o.comfortZone >= minWidth
            ? testerWidth + o.comfortZone
            : minWidth;
        const currentWidth = input.width();
        const isValidWidthChange =
          (newWidth < currentWidth && newWidth >= minWidth) ||
          (newWidth > minWidth && newWidth < o.maxWidth);

        // Animate width
        if (isValidWidthChange) {
          input.width(newWidth);
        }
      };

      testSubject.insertAfter(input);

      this.addEventListener('keyup', check);
      this.addEventListener('keydown', check);
      this.addEventListener('blur', check);
      this.addEventListener('update', check);
    });

    return this;
  };

  /**
   * If there is no result this label will be shown.
   * @type {{label: string, value: string}}
   */
  Drupal.autocomplete_deluxe.empty = {
    label: `- ${Drupal.t('None')} -`,
    value: '',
  };

  /**
   * EscapeRegex function from jquery autocomplete, is not included in Drupal.
   */
  Drupal.autocomplete_deluxe.escapeRegex = function (value) {
    return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/gi, '\\$&');
  };

  /**
   * Filter function from jquery autocomplete, is not included in Drupal.
   */
  Drupal.autocomplete_deluxe.filter = function (array, term) {
    const matcher = new RegExp(
      Drupal.autocomplete_deluxe.escapeRegex(term),
      'i',
    );
    return array.filter(function (value) {
      return matcher.test(value.label || value.value || value);
    });
  };

  Drupal.autocomplete_deluxe.Widget = function () {};

  /**
   * Url for the callback.
   */
  Drupal.autocomplete_deluxe.Widget.prototype.uri = null;

  /**
   * Allows widgets to filter terms.
   * @param term
   *   A term that should be accepted or not.
   * @return {Boolean}
   *   true if the term should be accepted.
   */
  Drupal.autocomplete_deluxe.Widget.prototype.acceptTerm = function (term) {
    return true;
  };

  Drupal.autocomplete_deluxe.Widget.prototype.init = function (settings) {
    if (navigator.appVersion.indexOf('MSIE 6.') !== -1) {
      return;
    }

    this.id = settings.input_id;
    this.jqObject = $(`#${this.id}`);

    this.uri = settings.uri;
    this.cardinality = settings.cardinality;
    this.required = settings.required;
    this.match_limit = settings.match_limit;
    this.synonyms =
      typeof settings.use_synonyms === 'undefined'
        ? false
        : settings.use_synonyms;
    this.not_found_message =
      typeof settings.use_synonyms === 'undefined'
        ? Drupal.t("The entity '@term' will be added.")
        : settings.not_found_message;
    this.not_found_message_allow =
      typeof settings.not_found_message_allow === 'undefined'
        ? false
        : settings.not_found_message_allow;
    this.new_terms =
      typeof settings.new_terms === 'undefined' ? false : settings.new_terms;
    this.query_parameters =
      typeof settings.query_parameters === 'undefined'
        ? false
        : settings.query_parameters;
    this.show_entity_id =
      typeof settings.show_entity_id === 'undefined'
        ? false
        : settings.show_entity_id;
    this.select_all =
      typeof settings.select_all === 'undefined' ? false : settings.select_all;
    this.select_all_label =
      typeof settings.select_all_label === 'undefined'
        ? Drupal.t('Add every suggestion')
        : settings.select_all_label;
    this.link_tags =
      typeof settings.link_tags === 'undefined' ? false : settings.link_tags;
    this.link_template =
      typeof settings.link_template === 'undefined'
        ? ''
        : settings.link_template;
    // The placeholder comes from PHP, which is what routed the path, so the
    // two can never drift apart.
    this.link_placeholder =
      typeof settings.link_placeholder === 'undefined'
        ? ''
        : settings.link_placeholder;
    this.no_empty_message =
      typeof settings.no_empty_message === 'undefined'
        ? Drupal.t(
            'No terms could be found. Please type in order to add a new term.',
          )
        : settings.no_empty_message;
    this.cardinality_message =
      this.cardinality > 0
        ? Drupal.formatPlural(
            this.cardinality,
            'This field cannot hold more than one value.',
            'This field cannot hold more than @count values.',
          )
        : '';

    this.wrapper = '""';

    if (typeof settings.delimiter === 'undefined') {
      this.delimiter = true;
      this.delimiterKey = '';
    } else {
      this.delimiter = settings.delimiter.charCodeAt(0);
      // Keydown reports the key, not the character code, so keep the
      // character itself next to the code the rest of the code still uses.
      this.delimiterKey = settings.delimiter.charAt(0);
    }

    this.items = {};

    const self = this;
    let parent = this.jqObject.parent();
    const parentsParent = this.jqObject.parent().parent();

    parentsParent.append(this.jqObject);
    parent.remove();
    parent = parentsParent;

    const generateValues = function (data, term) {
      const result = [];

      // Check for field cardinality and see if we have reached the limit.
      if (
        self.cardinality > 0 &&
        Object.keys(self.items).length >= self.cardinality
      ) {
        result.push({
          label: self.cardinality_message,
          noTerms: true,
        });
      } else {
        Object.keys(data).forEach(function (terms) {
          if (self.acceptTerm(terms)) {
            result.push({
              // The value carries the entity id and the label does not, so the
              // value is what is shown when the id was asked for.
              label: self.show_entity_id ? terms : data[terms],
              value: terms,
            });
          }
        });
      }

      // Whether one of the suggestions is the typed term itself, so that an
      // existing term is picked rather than offered again as a new one.
      const typed = term.trim().toLowerCase();
      const exists = Object.keys(data).some(function (key) {
        const label = String(data[key]).replace(/\s\([^()]*\)$/, '');
        return label.trim().toLowerCase() === typed;
      });

      // If there are no results and new terms OR not found message can be
      // displayed, push the result, so the menu can be shown.
      if (
        $.isEmptyObject(result) &&
        (self.new_terms || self.not_found_message_allow)
      ) {
        if (term !== ' ') {
          if (self.new_terms) {
            result.push({
              label: self.not_found_message_allow
                ? Drupal.formatString(self.not_found_message, { '@term': term })
                : term,
              value: term,
              newTerm: true,
            });
          } else {
            // New terms are not allowed, so the row must not promise that this
            // one will be added, and it must not be selectable either.
            result.push({ label: Drupal.t('No results found'), noTerms: true });
          }
        } else {
          result.push({
            label: self.no_empty_message,
            noTerms: true,
          });
        }
      } else if (self.new_terms && !exists && typed !== '') {
        // Other terms contain what was typed, but none of them is it, so the
        // new term is offered beside them instead of being unreachable.
        result.push({
          label: Drupal.formatString(self.not_found_message, {
            '@term': term,
          }),
          value: term,
          newTerm: true,
        });
      }
      // The row goes above the suggestions it stands for, and only where there
      // is more than one of them, since adding a single suggestion is what
      // picking that suggestion already does. It carries its own values, so
      // choosing it does not depend on the list still being on screen.
      if (self.select_all) {
        const selectable = result.filter(function (row) {
          return !row.noTerms && !row.newTerm;
        });
        if (selectable.length > 1) {
          result.unshift({
            label: self.select_all_label,
            value: '',
            selectAll: true,
            selectAllValues: selectable.map(function (row) {
              return { label: row.label, value: row.value };
            }),
          });
        }
      }

      return result;
    };

    const cache = {};
    let lastXhr = null;

    this.source = function (request, response) {
      let { term } = request;
      if (term in cache) {
        response(generateValues(cache[term], term));
        return;
      }

      // Some server collapse two slashes if the term is empty, so insert at
      // least a whitespace. This whitespace will later on be trimmed in the
      // autocomplete callback.
      if (!term) {
        term = ' ';
      }
      request.synonyms = self.synonyms;
      if (self.query_parameters) {
        Object.keys(self.query_parameters).forEach(function (key) {
          request[key] = self.query_parameters[key];
        });
      }
      const url = Drupal.url(`${settings.uri}?q=${term}`);
      lastXhr = $.getJSON(url, request, function (data, status, xhr) {
        cache[term] = data;
        if (xhr === lastXhr) {
          // Filter already selected items from the response data.
          if (typeof self.valueForm !== 'undefined') {
            const currentValues = self.valueForm.val().split('"');
            const dataArray = Object.entries(data);
            const dataFiltered = dataArray.filter(([key, value]) => {
              return !currentValues.includes(value);
            });
            data = Object.fromEntries(dataFiltered);
          }

          response(generateValues(data, term));
        }
      });
    };

    this.jqObject.autocomplete({
      source: this.source,
      minLength: settings.min_length,
    });

    const { jqObject } = this;

    const autocompleteDataKey =
      typeof this.jqObject.data('autocomplete') === 'object'
        ? 'item.autocomplete'
        : 'ui-autocomplete';

    const throbber = $(
      '<div class="autocomplete-deluxe-throbber autocomplete-deluxe-closed">&nbsp;</div>',
    ).insertAfter(jqObject);

    this.jqObject.bind('autocompletesearch', function (event, ui) {
      throbber.removeClass('autocomplete-deluxe-closed');
      throbber.addClass('autocomplete-deluxe-open');
    });

    this.jqObject.bind('autocompleteresponse', function (event, ui) {
      throbber.addClass('autocomplete-deluxe-closed');
      throbber.removeClass('autocomplete-deluxe-open');
      // If no results found, show a message and prevent selecting it as a tag.
      if (
        !drupalSettings.autocomplete_deluxe[this.id].new_terms &&
        typeof ui.item !== 'undefined' &&
        ui.item.newTerm
      ) {
        const uiWidgetContent = $('.ui-widget-content');
        uiWidgetContent.css('pointer-events', '');
        if (!ui.content.length) {
          ui.content[0] = {
            label: Drupal.t('No results found'),
            value: '',
          };
          uiWidgetContent.css('pointer-events', 'none');
        }
      }
    });

    // Monkey patch the _renderItem function jquery so we can highlight the
    // text, that we already entered.
    $.ui.autocomplete.prototype._renderItem = function (ul, item) {
      const t = item.label;
      if (this.term !== '') {
        const escapedValue = Drupal.autocomplete_deluxe.escapeRegex(this.term);
        const re = new RegExp(
          `()*""${escapedValue}""|${escapedValue}()*`,
          'gi',
        );
        const t = item.label.replace(
          re,
          "<span class='autocomplete-deluxe-highlight-char'>$&</span>",
        );
      }

      const row = $('<li></li>').data(autocompleteDataKey, item);
      // The row that stands for every suggestion carries a class of its own,
      // so a theme can set it apart from the suggestions below it.
      if (item.selectAll) {
        row.addClass('autocomplete-deluxe-select-all');
      }

      return row.append(`<a>${t}</a>`).appendTo(ul);
    };
  };

  Drupal.autocomplete_deluxe.Widget.prototype.generateValues = function (data) {
    const result = [];
    Object.keys(data).forEach(function (index) {
      result.push(data[index]);
    });
    return result;
  };

  /**
   * Creates a multiple selecting widget.
   */
  Drupal.autocomplete_deluxe.MultipleWidget = function (input, settings) {
    this.init(settings);
    this.setup();
  };

  Drupal.autocomplete_deluxe.MultipleWidget.prototype =
    new Drupal.autocomplete_deluxe.Widget();
  Drupal.autocomplete_deluxe.MultipleWidget.prototype.items = {};

  Drupal.autocomplete_deluxe.MultipleWidget.prototype.acceptTerm = function (
    term,
  ) {
    // Accept only terms, that are not in our items list.
    return !(term in this.items);
  };

  /**
   * Whether an item with that label is in the list already.
   *
   * The keys carry the entity id, as in "Label (7)", while a typed value does
   * not, so the trailing id is taken off before they are compared.
   */
  Drupal.autocomplete_deluxe.MultipleWidget.prototype.hasItemLabel = function (
    label,
  ) {
    const needle = String(label).trim().toLowerCase();
    return Object.keys(this.items).some(function (key) {
      const text = String(key)
        .replace(/\s\([^()]*\)$/, '')
        .trim()
        .toLowerCase();
      return text === needle;
    });
  };

  /**
   * The label of a tag, as a link to its entity where that was asked for.
   *
   * Only a saved entity carries an ID in its value, so a term that is about to
   * be created has nothing to point at and keeps its plain label. The link
   * opens in a new tab, so the form being edited is not left behind.
   *
   * @param {Object} widget
   *   The widget the tag belongs to.
   * @param {Object} item
   *   The item the tag was built from.
   *
   * @return {string}
   *   The markup for the label of the tag.
   */
  Drupal.autocomplete_deluxe.tagLabel = function (widget, item) {
    if (!widget.link_tags || !widget.link_template || item.newTerm === true) {
      return item.label;
    }

    const found = /\((\d+)\)$/.exec(item.value);
    if (!found) {
      return item.label;
    }

    if (!widget.link_placeholder) {
      return item.label;
    }

    const href = widget.link_template.replace(
      widget.link_placeholder,
      encodeURIComponent(found[1]),
    );
    return `<a href="${href}" class="autocomplete-deluxe-item-link" target="_blank" rel="noopener noreferrer">${item.label}</a>`;
  };

  Drupal.autocomplete_deluxe.MultipleWidget.Item = function (widget, item) {
    if (item.newTerm === true) {
      item.label = item.value;
    } else if (item.noTerms === true) {
      return;
    }

    this.value = item.value;
    this.element = $(
      `<span class="autocomplete-deluxe-item">${Drupal.autocomplete_deluxe.tagLabel(widget, item)}</span>`,
    );
    this.widget = widget;
    this.item = item;
    const self = this;

    const close = $(
      '<a class="autocomplete-deluxe-item-delete" href="javascript:void(0)"></a>',
    ).appendTo(this.element);
    // Use single quotes because of the double quote encoded stuff.
    // .. then to make this work for single quotes in names, like O'Brian, encode '.
    const encodedVal = this.value.replace("'", '&#039;');
    const input = $(`<input type="hidden" value='${encodedVal}'/>`).appendTo(
      this.element,
    );

    // Touchstart as well as mousedown, since a touch browser does not always
    // send a mouse event for a tap on the delete control.
    close.on('mousedown touchstart', function (event) {
      event.preventDefault();
      self.remove(item);
      const valueInput = self.widget.jqObject
        .parents('.autocomplete-deluxe-container')
        .next()
        .find('input');
      valueInput.trigger('change');
    });
  };

  Drupal.autocomplete_deluxe.MultipleWidget.Item.prototype.remove =
    function () {
      this.element.remove();
      const values = this.widget.valueForm.val();
      const escapedValue = Drupal.autocomplete_deluxe.escapeRegex(
        this.item.value,
      );
      const regex = new RegExp(`()*""${escapedValue}""()*`, 'gi');
      this.widget.valueForm.val(values.replace(regex, ''));
      delete this.widget.items[this.value];
    };

  Drupal.autocomplete_deluxe.MultipleWidget.prototype.setup = function () {
    const { jqObject } = this;
    const parent = jqObject.parents('.autocomplete-deluxe-container');
    const valueContainer = parent.next();
    const valueInput = valueContainer.find('input');
    const { items } = this;
    const self = this;
    this.valueForm = valueInput;

    // Order values based on the UI. Usually called after a manual sort.
    this.orderValues = function () {
      const items = [];
      parent
        .find('.autocomplete-deluxe-item input')
        .each(function (index, value) {
          items[index] = value.value;
        });

      valueInput[0].value = `""${items.join('"" ""')}""`;
      valueInput.trigger('change');
    };

    Sortable.create(parent.get(0), {
      draggable: '.autocomplete-deluxe-item',
      onEnd: function onEnd() {
        self.orderValues();
      },
    });

    // Override the resize function, so that the suggestion list doesn't resizes
    // all the time.
    const autocompleteDataKey =
      typeof this.jqObject.data('autocomplete') === 'object'
        ? 'autocomplete'
        : 'ui-autocomplete';

    // The override is skipped where jQuery UI did not initialize the
    // autocomplete on the input, as happens when the element is rendered into
    // a dialog whose markup never reached the behavior. The list then resizes
    // as jQuery UI sees fit, which is better than throwing.
    const uiAutocomplete = jqObject.data(autocompleteDataKey);
    if (uiAutocomplete) {
      uiAutocomplete._resizeMenu = function () {};
    }

    jqObject.show();

    valueInput.hide();

    // Add the default values to the box.
    let defaultValues = valueInput.val();
    defaultValues = defaultValues.trim();
    defaultValues = defaultValues.substr(2, defaultValues.length - 4);
    defaultValues = defaultValues.split(/"" +""/);

    Object.keys(defaultValues).forEach(function (index) {
      const value = defaultValues[index];
      if (value !== '') {
        // If a terms is encoded in double quotes, then the label should have
        // no double quotes.
        let label =
          value.match(/["][\w|\s|\D|]*["]/gi) !== null
            ? value.substr(1, value.length - 2)
            : value;
        const entityId = value.match(/.+\s\(([^)]+)\)/);
        if (entityId && entityId.length > 1 && !self.show_entity_id) {
          label = label.replace(` (${entityId[1]})`, '');
        }
        const itemInit = {
          label: Drupal.checkPlain(label),
          value,
        };
        const item = new Drupal.autocomplete_deluxe.MultipleWidget.Item(
          self,
          itemInit,
        );
        if (typeof item.element !== 'undefined') {
          item.element.insertBefore(jqObject);
          items[item.value] = item;
        }
      }
    });

    jqObject.addClass('autocomplete-deluxe-multiple');
    parent.addClass('autocomplete-deluxe-multiple');

    // Adds a value to the list.
    this.addValue = function (uiItem) {
      const item = new Drupal.autocomplete_deluxe.MultipleWidget.Item(
        self,
        uiItem,
      );
      if (typeof item.element !== 'undefined') {
        item.element.insertBefore(jqObject);
        items[uiItem.value] = item;
        const newValue = ` ${self.wrapper}${uiItem.value}${self.wrapper}`;
        const values = valueInput.val();
        valueInput.val(values + newValue);
        jqObject.val('');
        // The value field carries the real value, so a change on it is what
        // the ajax system listens for.
        valueInput.trigger('change');
      }
    };

    parent.mouseup(function () {
      jqObject.autocomplete('search', '');
      jqObject.focus();
    });

    jqObject.bind('autocompleteselect', function (event, ui) {
      const allowNewTerms =
        drupalSettings.autocomplete_deluxe[this.id].new_terms;
      // If new terms are not allowed to be added as per the field widget
      // settings, do not continue to process and add that value.
      if (!allowNewTerms && ui.item.newTerm) {
        this.value = '';
        return;
      }
      // The select all row stands for the suggestions it was built from, so it
      // adds each of them through the same path a single pick takes, and is
      // never added as a value of its own.
      if (ui.item.selectAll) {
        ui.item.selectAllValues.forEach(function (value) {
          if (self.acceptTerm(value.value)) {
            self.addValue(value);
          }
        });
        jqObject.val('');
        jqObject.width(25);
        return false;
      }
      self.addValue(ui.item);
      jqObject.width(25);
      // Return false to prevent setting the last term as value for the jqObject.
      return false;
    });

    jqObject.bind('autocompletechange', function (event, ui) {
      jqObject.val('');
    });

    jqObject.blur(function () {
      const lastElement = jqObject
        .parent()
        .children('.autocomplete-deluxe-item')
        .last();
      lastElement.removeClass('autocomplete-deluxe-item-focus');
    });

    let clear = false;

    // Keydown, and not keypress, so that Backspace is reported at all.
    jqObject.keydown(function (event) {
      let value = jqObject.val();
      // If a comma was entered and there is none or more then one comma, or the
      // enter key was entered, then enter the new term.
      if (
        (self.delimiterKey !== '' &&
          event.key === self.delimiterKey &&
          value.split('"').length - 1 !== 1) ||
        (event.which === 13 && jqObject.val() !== '')
      ) {
        const allowNewTerms =
          drupalSettings.autocomplete_deluxe[this.id].new_terms;
        // If new terms are not allowed to be added as per the field widget
        // settings, do not continue to process and add that value.
        if (!allowNewTerms) {
          this.value = '';
          // Returning false stops the key press here, so it never reaches the
          // form and saves the node behind the author's back.
          return false;
        }

        value = value.substr(0, value.length);
        // The same term is not added twice, whether it was picked from the
        // list before or typed again.
        if (
          typeof self.items[value] === 'undefined' &&
          !self.hasItemLabel(value) &&
          value !== ''
        ) {
          const uiItem = {
            label: value,
            value,
          };
          self.addValue(uiItem);
        }
        clear = true;
        if (event.which === 13) {
          return false;
        }
      }

      // If the Backspace key was hit and the input is empty.
      if (event.which === 8 && value === '') {
        const lastElement = jqObject
          .parent()
          .children('.autocomplete-deluxe-item')
          .last();
        // then mark the last item for deletion or deleted it if already marked.
        if (lastElement.hasClass('autocomplete-deluxe-item-focus')) {
          const value = lastElement.children('input').val();
          self.items[value].remove(self.items[value]);
          jqObject.autocomplete('search', '');
        } else {
          lastElement.addClass('autocomplete-deluxe-item-focus');
        }
      } else {
        // Remove the focus class if any other key was hit.
        const lastElement = jqObject
          .parent()
          .children('.autocomplete-deluxe-item')
          .last();
        lastElement.removeClass('autocomplete-deluxe-item-focus');
      }
    });

    // A pasted list is split on the delimiter, so several values can be added
    // in one go instead of landing in the field as one long string. Each piece
    // is looked up first, so an entity that exists is referenced rather than
    // created again.
    const bareLabel = function (label) {
      return String(label)
        .replace(/\s\([^()]*\)$/, '')
        .trim()
        .toLowerCase();
    };

    const hasPastedLabel = function (label) {
      const needle = bareLabel(label);
      return Object.keys(self.items).some(function (key) {
        return bareLabel(key) === needle;
      });
    };

    jqObject.on('paste', function (event) {
      const clipboard =
        (event.originalEvent || event).clipboardData || window.clipboardData;
      if (!clipboard || self.delimiterKey === '') {
        return;
      }
      const pasted = clipboard.getData('text');
      if (pasted.indexOf(self.delimiterKey) === -1) {
        return;
      }
      event.preventDefault();

      const addPastedValue = function (term) {
        if (
          self.cardinality > 0 &&
          Object.keys(self.items).length >= self.cardinality
        ) {
          return;
        }
        const url = Drupal.url(`${self.uri}?q=${encodeURIComponent(term)}`);
        $.getJSON(url, {}, function (data) {
          let matched = null;
          Object.keys(data).forEach(function (value) {
            if (bareLabel(data[value]) === term.toLowerCase()) {
              matched = { label: data[value], value };
            }
          });
          if (hasPastedLabel(term)) {
            return;
          }
          if (matched) {
            self.addValue(matched);
          } else if (self.new_terms) {
            self.addValue({ label: term, value: term, newTerm: true });
          }
        });
      };

      pasted.split(self.delimiterKey).forEach(function (piece) {
        const term = piece.trim();
        if (term !== '') {
          addPastedValue(term);
        }
      });
      jqObject.val('');
    });

    jqObject.autoGrowInput({
      comfortZone: 50,
      minWidth: 10,
      maxWidth: 460,
    });

    jqObject.keyup(function () {
      if (clear) {
        // Trigger the search, so it display the values for an empty string.
        jqObject.autocomplete('search', '');
        jqObject.val('');
        clear = false;
        // Return false to prevent entering the last character.
        return false;
      }
    });
  };
})(jQuery, Drupal, once, drupalSettings, Sortable);
