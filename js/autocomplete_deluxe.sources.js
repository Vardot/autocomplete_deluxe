// $Id

(function ($) {
  Drupal.autocomplete_deluxe = Drupal.autocomplete_deluxe || {};

  /**
   * Main abstract source object
   */
  Drupal.autocomplete_deluxe.source = function() {
  };

  Drupal.autocomplete_deluxe.source.prototype.multipleValues = 1;
  Drupal.autocomplete_deluxe.source.prototype.delimiter = ', ';
  
  /**
   * Sets the source element from the autocomplete deluxe object.
   */
  Drupal.autocomplete_deluxe.source.prototype.setResponse = function(request, response) {
    response(null);
  };

  Drupal.autocomplete_deluxe.source.prototype.search = function(autocomplete, ui, ac_deluxe) {
    if (this.multipleValues > 1) {
      var term = Drupal.autocomplete_deluxe.extractLast(autocomplete.value, this.delimiter);
      if ( term.length < ac_deluxe.minLength ) {
        return false;
      }
    }
  };

  Drupal.autocomplete_deluxe.source.prototype.select = function(autocomplete, ui) {
    if (this.multipleValues > 1 || this.multipleValues == -1) {
      var terms = Drupal.autocomplete_deluxe.split(autocomplete.value, this.delimiter);
      if (terms.length > this.multipleValues && this.multipleValues != -1) {
        // if there are to many inputs, replace the the last and the second 
        // last inputs.
        terms.pop();
      }
      // remove the current input
      terms.pop();
      // add the selected item
      terms.push(ui.item.value);
      // add placeholder to get the comma-and-space at the end
      terms.push("");
      autocomplete.value = terms.join(this.delimiter);
      return false;
    }
  };

  /**
   * List Source Object
   * @param data The data for the autocomplete object.
   */
  Drupal.autocomplete_deluxe.listSingleSource = function (data) {
    this.list = new Array();
    var instance = this;
    jQuery.each(data, function(index, value) {
      instance.list.push({
        label: $.trim(value),
        value: index
      });
    });
  };

  // Set base class
  Drupal.autocomplete_deluxe.listSingleSource.prototype = new Drupal.autocomplete_deluxe.source();

  /**
   * Will be called by the JQuery autocomplete source function to retrieve 
   * the data.
   */
  Drupal.autocomplete_deluxe.listSingleSource.prototype.setResponse = function (request, response) {
    var filtered = Drupal.autocomplete_deluxe.filter(this.list, Drupal.autocomplete_deluxe.extractLast(request.term, this.delimiter));
    response(filtered);
  };

  /**
   * Ajax Source Object for single selection
   * @param uri URI to server with the data.
   * @param dataType If nothing is passed, json will be used as default.
   */
  Drupal.autocomplete_deluxe.ajaxSingleSource = function (uri, dataType) {
    this.cache = new Array();
    this.uri = uri;
    if (dataType === undefined) {
      this.dataType = 'json';
    }
    else {
      this.dataType = dataType;
    }
  };

  // Set base class
  Drupal.autocomplete_deluxe.ajaxSingleSource.prototype = new Drupal.autocomplete_deluxe.source();

  /**
   * Will be called by the JQuery autocomplete source function to retrieve 
   * the data.
   */
  Drupal.autocomplete_deluxe.ajaxSingleSource.prototype.setResponse = function (request, response) {
    var instance = this;
    if (request.term in this.cache) {
      response(this.cache[request.term]);
      return;
    }
    $.ajax({
      url: this.uri + '/' + Drupal.autocomplete_deluxe.extractLast(request.term, this.delimiter),
      dataType: this.dataType,
      success: function(data) {
        response(instance.success(data, request));
      }
    });
  };

  /**
   * Success function for the autocomplete object.
   */
  Drupal.autocomplete_deluxe.ajaxSingleSource.prototype.success = function(data, request) {
    var list = new Array();
    jQuery.each(data, function(index, value) {
      list.push({
        label: value,
        value: index
      });
    });
    this.cache[request.term] = list;
    return list;
  };
})(jQuery);