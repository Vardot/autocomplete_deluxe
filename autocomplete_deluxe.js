
/**
 * @file:
 * Converts textfield to a autocomplete deluxe widget.
 */



(function($) {
  Drupal.autocomplete_deluxe = Drupal.autocomplete_deluxe || {};

  Drupal.behaviors.autocomplete_deluxe = {
    attach: function(context) {
      var autocomplete_settings = Drupal.settings.autocomplete_deluxe;

      $('input.autocomplete-deluxe-form').once( function() {
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


    this.multiple = settings.multiple;

    this.jqObject.autocomplete({
      'source' : [
        "ActionScript",
        "AppleScript",
        "Asp",
        "BASIC",
        "C",
        "C++",
        "Clojure",
        "COBOL",
        "ColdFusion",
        "Erlang",
        "Fortran",
        "Groovy",
        "Haskell",
        "Java",
        "JavaScript",
        "Lisp",
        "Perl",
        "PHP",
        "Python",
        "Ruby",
        "Scala",
        "Scheme"
      ],
      'minLength': settings.min_length
    });

    var parent = this.jqObject.parent();
    var widget = $('<a href="javascript:void(0)" class="autocomplete-deluxe-single"></a>');

    parent.append(widget);
    widget.append($('<span>- ' + Drupal.t('None') + ' -</span>'));

    var search = $('<div class="autocomplete-deluxe-search"></div>');
    search.append(this.jqObject);


    var list = this.jqObject.autocomplete( "widget" );
    list.css('position', 'relative');
    list.css('float', 'none');

    var dropdown = $('<div class="autocomplete-deluxe-dropdown"></div>');
    dropdown.insertAfter(widget)
    dropdown.append(search);
    dropdown.append(list);
    dropdown.hide();


    var jqObject = this.jqObject;


    widget.mousedown(function() {
      if ($(this).hasClass('autocomplete-deluxe-single-open')) {
        jqObject.autocomplete('close', '');
        $(this).next().hide();
        $(this).removeClass('autocomplete-deluxe-single-open');
      }
      else {
        $(this).next().show();
        $(this).addClass('autocomplete-deluxe-single-open');
        jqObject.autocomplete('search', '');
      }
    });//*/

    jqObject.bind('autocompleteselect', function (event, ui) {
      dropdown.hide();
      widget.removeClass('autocomplete-deluxe-single-open');
      widget.children('span').text(ui.item.value).html();
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

  Drupal.autocomplete_deluxe.singleWidget = function() {

  }

})(jQuery);
