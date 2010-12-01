// $Id

(function($) {
  Drupal.autocomplete_deluxe = Drupal.autocomplete_deluxe || {};

  Drupal.behaviors.autocomplete_deluxe = {
    attach: function(context) {
      var autocomplete_settings = Drupal.settings.autocomplete_deluxe;

      $('input.autocomplete-deluxe-form').once(function() {
        new Drupal.autocomplete_deluxe(this, autocomplete_settings[$(this).attr('id')]);
      });
    }
  };

  /**
   * Autocomplete deluxe object.
   */
  Drupal.autocomplete_deluxe = function(input, settings) {
    this.id = settings.input_id;
    this.jqObject = $('#' + this.id);
    this.jqObject.addClass('ui-corner-left');
    this.type = settings.type;
    this.minLength = settings.min_length;

    this.multiple = settings.multiple;
    this.delimiter = settings.autocomplete_multiple_delimiter;

    this.selected = false;
    this.groupSelected = false;
    this.opendByFocus = false;

    this.button = $('<span>&nbsp;</span>');
    this.button.attr( {
      'tabIndex': -1,
      'title': 'Show all items'
    });
    this.button.insertAfter(this.jqObject);

    this.button.button( {
      icons: {
        primary: 'ui-icon-triangle-1-s'
      },
      text: false
    });

    // Don't round the left corners.
    this.button.removeClass('ui-corner-all');
    this.button.addClass('ui-corner-right ui-button-icon autocomplete-deluxe-button');

    this.jqObject.autocomplete();
    this.jqObject.autocomplete("option", "minLength", this.minLength);
    // Add a custom class, so we can style the autocomplete box without
    // interfering with other jquery autocomplete widgets.
    this.jqObject.autocomplete("widget").addClass('autocomplete-deluxe-widget');

    // Save the current autocomplete object, so it can be used in
    // handlers.
    var instance = this;

    // Event handlers.
    this.jqObject.focus(function() {
      // If the something was selected, the window should not open again.
      if (!instance.selected || instance.groupSelected) {
        instance.open();
        instance.opendByFocus = true;
      } else {
        // If the something was selected, the window should not open again.
        instance.selected = false;
      }
    });

    // Needed when the window is closed but the textfield has the focus.
    this.jqObject.click(function() {
      if (!instance.opendByFocus) {
        instance.toggle();
      } else {
        instance.close();
      }
    });

    switch (this.type) {
    case 'ajax':
      var uri = location.protocol + '//' + location.host + Drupal.settings.basePath + '?q=' + settings.uri;
      this.source = new Drupal.autocomplete_deluxe.ajaxSource(uri);
      break;
    case 'list':
      this.source = new Drupal.autocomplete_deluxe.listSource(settings.data);
      break;
    }

    this.source.autocomplete = this;
    this.source.multiple = settings.multiple;
    this.source.delimiter = settings.multiple_delimeter;

    this.jqObject.autocomplete("option", "source", function(request, response) {
      instance.source.setResponse(request, response);
    });

    this.jqObject.bind("autocompletesearch", function(event, ui) {
      instance.jqObject.addClass('throbbing');
      return instance.source.search(ui);
    });

    this.jqObject.bind("autocompletefocus", function(event, ui) {
      if (instance.multiple > 1 || instance.multiple < 0) {
        return false;
      }
    });

    this.jqObject.bind("autocompleteselect", function(event, ui) {
      instance.close();
      instance.selected = true;
      return instance.source.select(this, ui);
    });

    // Since jquery autocomplete by default strips html text by using .text()
    // we need our own _renderItem function to display html content.
    this.jqObject.data("autocomplete")._renderItem = function(ul, item) {
      return $("<li></li>").data("item.autocomplete", item).append("<a>" + item.label + "</a>").appendTo(ul);
    };

    // Costume response callback to delete the throbbing class. Could be deleted
    // once the ui-autocomplete-loading css class is implemented in seven theme.
    this.jqObject.data("autocomplete")._response = function(content) {
      if (content && content.length) {
        content = this._normalize(content);
        this._suggest(content);
        this._trigger("open");
      } else {
        this.close();
      }
      this.element.removeClass('throbbing');
    };

    this.button.click(function() {
      instance.toggle();
    });
  };

  /**
   * EscapeRegex function from jquery autocomplete, is not included in drupal.
   */
  Drupal.autocomplete_deluxe.escapeRegex = function(value) {
    return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/gi, "\\$&");
  };

  /**
   * Filter function from jquery autocomplete, is not included in drupal.
   */
  Drupal.autocomplete_deluxe.filter = function(array, term) {
    var matcher = new RegExp(Drupal.autocomplete_deluxe.escapeRegex(term), "i");
    return $.grep(array, function(value) {
      return matcher.test(value.label || value.value || value);
    });
  };

  /**
   * Open the autocomplete window.
   */
  Drupal.autocomplete_deluxe.prototype.open = function() {
    this.jqObject.autocomplete("search", this.jqObject.val());
    this.button.addClass("ui-state-focus");
    this.groupSelected = false;
  };

  /**
   * Close the autocomplete window.
   */
  Drupal.autocomplete_deluxe.prototype.close = function() {
    var value = this.jqObject.val();
    // If the Selector is group, then keep the selection list open.
    if (value.substring(value.length - 1, value.length) != ':') {
      this.jqObject.autocomplete("close");
      this.button.removeClass("ui-state-focus");
      this.opendByFocus = false;
    } else {
      this.groupSelected = true;
    }
  };

  /**
   * Toogle the autcomplete window.
   */
  Drupal.autocomplete_deluxe.prototype.toggle = function() {
    if (this.jqObject.autocomplete("widget").is(":visible")) {
      this.close();
    } else {
      this.open();
    }
  };

  /**
   * Split a string with delimiter.
   */
  Drupal.autocomplete_deluxe.split = function(val, delimiter) {
    return val.split(delimiter);
  };

  /**
   * Returns the last term of an string.
   */
  Drupal.autocomplete_deluxe.extractLast = function(term, delimiter) {
    return Drupal.autocomplete_deluxe.split(term, delimiter).pop();
  };

  /**
   * Main abstract source object.
   */
  Drupal.autocomplete_deluxe.source = function() {
  };

  // Some base settings for all source objects.
  Drupal.autocomplete_deluxe.source.prototype.autocomplete = null;
  Drupal.autocomplete_deluxe.source.prototype.multiple = 1;
  Drupal.autocomplete_deluxe.source.prototype.delimiter = ', ';

  Drupal.autocomplete_deluxe.source.prototype.highlight = function(term, data) {
    var lterm = $.ui.autocomplete.escapeRegex(Drupal.autocomplete_deluxe.extractLast(term, this.delimiter));
    // If no term is entered, we want to return the data as it is.
    if (lterm == '') {
      return data;
    } else {
      // Create a new data array, so we can keep our original data clean
      // (without <strong> tags).
      var newData = new Array();
      var regex = new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + lterm + ")(?![^<>]*>)(?![^&;]+;)", "gi");
      for ( var i in data) {
        var nterm = data[i].label.replace(regex, "<strong>$1</strong>");
        newData.push( {
          label: nterm,
          value: data[i].value
        });
      }
      return newData;
    }
  };

  /**
   * Sets the source element from the autocomplete deluxe object.
   */
  Drupal.autocomplete_deluxe.source.prototype.response = function(request, response, data) {
    response(this.highlight(request.term, data));
  };

  /**
   * Costume search for multiple values.
   */
  Drupal.autocomplete_deluxe.source.prototype.search = function(ui) {
    if (this.multiple > 1 && this.autocomplete.jqObject.value !== undefined) {
      var term = Drupal.autocomplete_deluxe.extractLast(this.autocomplete.jqObject.value, this.delimiter);
      if (term.length < this.autocomplete.minLength) {
        return false;
      }
    }
  };

  /**
   * Select function for multiple values.
   */
  Drupal.autocomplete_deluxe.source.prototype.select = function(input, ui) {
    if (this.multiple > 1 || this.multiple == -1) {
      var terms = Drupal.autocomplete_deluxe.split(input.value, this.delimiter);
      // Remove the current input.
      terms.pop();
      // Add the selected item
      terms.push(ui.item.value);
      // Add placeholder to get the comma-and-space at the end.
      terms.push("");
      input.value = terms.join(this.delimiter);
      return false;
    }
  };

  /**
   * List Source Object
   * 
   * @param data
   *          The data for the autocomplete object.
   */
  Drupal.autocomplete_deluxe.listSource = function(data) {
    this.list = new Array();
    var instance = this;
    jQuery.each(data, function(index, value) {
      instance.list.push( {
        label: $.trim(value),
        value: index
      });
    });
  };

  // Set base class.
  Drupal.autocomplete_deluxe.listSource.prototype = new Drupal.autocomplete_deluxe.source();

  /**
   * Will be called by the JQuery autocomplete source function to retrieve the
   * data.
   */
  Drupal.autocomplete_deluxe.listSource.prototype.setResponse = function(request, response) {
    var filtered = Drupal.autocomplete_deluxe.filter(this.list, Drupal.autocomplete_deluxe.extractLast(request.term, this.delimiter));
    this.response(request, response, filtered);
  };

  /**
   * Ajax Source Object for selection
   * 
   * @param uri
   *          URI to server with the data.
   * @param dataType
   *          If nothing is passed, json will be used as default.
   */
  Drupal.autocomplete_deluxe.ajaxSource = function(uri, dataType) {
    this.cache = new Array();
    this.uri = uri;
    if (dataType === undefined) {
      this.dataType = 'json';
    } else {
      this.dataType = dataType;
    }
  };

  // Set base class.
  Drupal.autocomplete_deluxe.ajaxSource.prototype = new Drupal.autocomplete_deluxe.source();

  /**
   * Will be called by the JQuery autocomplete source function to retrieve the
   * data.
   */
  Drupal.autocomplete_deluxe.ajaxSource.prototype.setResponse = function(request, response) {
    var instance = this;
    if (request.term in this.cache) {
      instance.response(request, response, (this.cache[request.term]));
      return;
    }
    $.ajax( {
      url: this.uri + '/' + Drupal.autocomplete_deluxe.extractLast(request.term, this.delimiter),
      dataType: this.dataType,
      success: function(data) {
        instance.response(request, response, instance.success(data, request));
      }
    });
  };

  /**
   * Success function for the autocomplete object.
   */
  Drupal.autocomplete_deluxe.ajaxSource.prototype.success = function(data, request) {
    var list = new Array();
    jQuery.each(data, function(index, value) {
      list.push( {
        label: value,
        value: index
      });
    });
    this.cache[request.term] = list;
    return list;
  };
})(jQuery);