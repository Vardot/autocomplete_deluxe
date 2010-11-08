// $Id

(function ($) {
  Drupal.autocomplete_deluxe = Drupal.autocomplete_deluxe || {};

  Drupal.behaviors.autocomplete_deluxe = {
    attach: function(context) {
      var autocomplete_settings = Drupal.settings.autocomplete_deluxe;

      $('input.autocomplete-deluxe-form').once(function() {
        //var settings = processSettings();
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

    this.multipleValues = settings.autocomplete_multiple;
    this.delimiter = settings.autocomplete_multiple_delimiter;

    this.selected = false;
    this.groupSelected = false;
    this.opendByFocus = false;
  
    this.button = $('<span>&nbsp;</span>');
    this.button.attr({
      'tabIndex': -1,
      'title': 'Show all items'
    });
    this.button.insertAfter(this.jqObject);

    this.button.button({
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

    // Event handlers
    this.jqObject.focus(function() {
      // If the something was selected, the window should not open again.
      if (!instance.selected || instance.groupSelected) {
        instance.open();
        instance.opendByFocus = true;
      }
      else {
        // If the something was selected, the window should not open again.
        instance.selected = false;
      }
    });

    // Needed when the window is closed but the textfield has the focus.
    this.jqObject.click(function() {
      if (! instance.opendByFocus) {
        instance.toggle();
      }
      else {
        instance.close();
      }
    });

    switch (this.type) {
    case 'ajax':
      var uri = location.protocol + '//' + location.host + Drupal.settings.basePath + settings.uri;
      this.source = new Drupal.autocomplete_deluxe.ajaxSingleSource(uri);
      break;
    case 'list':
      this.source = new Drupal.autocomplete_deluxe.listSingleSource(settings.data);
      break;
    }

    this.source.multipleValues = settings.multiple;
    this.source.delimiter = settings.multiple_delimeter;

    this.jqObject.autocomplete("option", "source", function(request, response) {
      instance.source.setResponse(request, response); 
    });

    this.jqObject.bind("autocompletesearch", function(event, ui) {
      // prevent value inserted on focus
      return instance.source.search(this, ui, instance);
    });

    this.jqObject.bind("autocompletefocus", function(event, ui) {
      if (instance.source.multipleValues > 1) {
        // prevent value inserted on focus
        return false;
      }
    });

    this.jqObject.bind("autocompleteselect", function(event, ui) {
      instance.close();
      instance.selected = true;
      return instance.source.select(this, ui, instance);
    });

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
    var matcher = new RegExp(Drupal.autocomplete_deluxe.escapeRegex(term), "i" );
    return $.grep( array, function(value) {
      return matcher.test(value.label || value.value || value);
    });
  };

  /**
   * Open the autocomplete window.
   */
  Drupal.autocomplete_deluxe.prototype.open = function () {
    this.jqObject.autocomplete("search", this.jqObject.val());
    this.button.addClass("ui-state-focus");
    this.groupSelected = false;
  };

  /**
   * Close the autocomplete window.
   */
  Drupal.autocomplete_deluxe.prototype.close = function () {
    var value = this.jqObject.val();
    // If the Selector is group, then keep the selection list open.
    if (value.substring(value.length-1, value.length) != ':') {
      this.jqObject.autocomplete("close");
      this.button.removeClass("ui-state-focus");
      this.opendByFocus = false;
    }
    else {
      this.groupSelected = true;
    }
  };

  /**
   * Toogle the autcomplete window.
   */
  Drupal.autocomplete_deluxe.prototype.toggle = function () {
    if (this.jqObject.autocomplete("widget").is(":visible")) {
      this.close();
    }
    else {
      this.open();
    }    
  };

  Drupal.autocomplete_deluxe.split = function(val, delimiter) {
    return val.split(delimiter);
  };

  Drupal.autocomplete_deluxe.extractLast = function(term, delimiter) {
    return Drupal.autocomplete_deluxe.split(term, delimiter).pop();
  };
})(jQuery);