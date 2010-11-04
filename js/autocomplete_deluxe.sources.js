// $Id

(function ($) {
  Drupal.autocomplete_deluxe = Drupal.autocomplete_deluxe || {};
  
  /**
   * Main abstract source object
   */
  Drupal.autocomplete_deluxe.source = function() {};
  /**
   * Sets the source element from the autocomplete deluxe object.
   */
  Drupal.autocomplete_deluxe.source.prototype.setResponse = function(request, response) {
    response(null);
  };

  Drupal.autocomplete_deluxe.source.prototype.search = function(autocomplete, ui) {
    return true;
  };

  Drupal.autocomplete_deluxe.source.prototype.select = function(autocomplete, ui) {
    return true;
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
    var filtered = Drupal.autocomplete_deluxe.filter(this.list, request.term);
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
      url: this.uri + '/' + Drupal.autocomplete_deluxe.extractLast(request.term),
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

  /**
   * Event listener for search.
   * Prevents the autocomplete window from opening the autocomplete window for 
   * multiple terms.
   */
  Drupal.autocomplete_deluxe.ajaxSingleSource.prototype.search = function(autocomplete, ui, ac_deluxe) {
    var term = Drupal.autocomplete_deluxe.extractLast(autocomplete.value);
    if ( term.length < ac_deluxe.minLength ) {
      return false;
    }
  };
  
  Drupal.autocomplete_deluxe.ajaxSingleSource.prototype.select = function(autocomplete, ui) {
    var terms = Drupal.autocomplete_deluxe.split(autocomplete.value);
    // remove the current input
    terms.pop();
    // add the selected item
    terms.push(ui.item.value);
    // add placeholder to get the comma-and-space at the end
    terms.push("");
    autocomplete.value = terms.join(", ");
    
    return false;
  };

})(jQuery);