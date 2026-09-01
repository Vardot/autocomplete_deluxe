# Autocomplete Deluxe

The Autocomplete Deluxe module is an enhanced autocomplete element that uses the
JQuery UI autocomplete. It will also implement a widget for taxonomy. This
module does not require any 3rd party jQuery libraries.

For a full description of the module, visit the
[project page](https://www.drupal.org/project/autocomplete_deluxe).

Submit bug reports and feature suggestions, or track changes in the
[issue queue](https://www.drupal.org/project/issues/autocomplete_deluxe).


## Table of contents

- Requirements
- Installation
- Configuration
- FAQ
- Maintainers


## Requirements

This module requires no modules outside of Drupal core.


## Installation

Install as you would normally install a contributed Drupal module. For further
information, see
[Installing Drupal Modules](https://www.drupal.org/docs/extending-drupal/installing-drupal-modules).


## Configuration

To set up a field named Tags which uses an Autocomplete Deluxe widget to set
values for that field from the Tags taxonomy, do the following:

 - Navigate to Administration > Modules and enable the Autocomplete Deluxe
   module.
 - Navigate to Administration  > Structure > Content types and select manage
   fields of the content type you wish to edit.
 - Add a new field of "Term reference" named "Tags". Select the Widget Type
   `"Autocomplete Deluxe"` in the drop down menu. Save.
 - Select the Tags vocabulary.  Save field settings.
 - Customize or keep the default Autocomplete Deluxe settings for the field.
   Save settings.

Now when new content is added the Tags widget allows editors to enter
existing tags as well as create new ones.


## Faq

**Q: Can I use the Autocomplete Deluxe widget on a Views exposed filter?**

**A:** Yes. Add the field as an ordinary exposed Autocomplete filter in the
view, then swap the element in a custom module. The autocomplete route needs
a selection settings key, which is a hash of the selection settings that has
to be in the key value store before the route is called.

```php
use Drupal\Core\Form\FormStateInterface;

/**
 * Implements hook_form_alter().
 */
function my_module_form_alter(&$form, FormStateInterface $form_state, $form_id) {
  if ($form_id === 'views_exposed_form') {
    // One call per exposed filter, with the field machine name.
    my_module_autocomplete_deluxe_filter('field_tags', $form);
  }
}

/**
 * Turns the exposed filter of a field into an Autocomplete Deluxe element.
 */
function my_module_autocomplete_deluxe_filter(string $field_name, array &$form) {
  $filter_id = $form['#info']['filter-' . $field_name . '_target_id']['value'] ?? FALSE;
  if (!$filter_id || !isset($form[$filter_id])) {
    return;
  }

  $target_type = $form[$filter_id]['#target_type'];

  $form[$filter_id] = [
    '#type' => 'autocomplete_deluxe',
    '#target_type' => $target_type,
    '#selection_handler' => 'default:' . $target_type,
    '#selection_settings' => [
      'target_bundles' => $form[$filter_id]['#selection_settings']['target_bundles'],
      'sort' => ['field' => '_none'],
      'auto_create' => FALSE,
      'match_operator' => 'CONTAINS',
    ],
    '#limit' => 10,
    '#size' => 60,
    '#new_terms' => FALSE,
    '#min_length' => 1,
    '#delimiter' => ',',
    '#not_found_message_allow' => FALSE,
  ];
}
```

The element puts the selection settings in the key value store and builds the
route itself, in its process callback, so none of that has to be repeated here.
Setting `#autocomplete_deluxe_path` yourself still works and still wins, for
code written against the older element.

**Q: Can I use the element on a form of my own?**

**A:** Yes, and it is the same wiring: build the selection settings, put them
in the key value store under their hash, and point the element at the
autocomplete route.

```php
$target_type = 'taxonomy_term';

$form['tags'] = [
  '#type' => 'autocomplete_deluxe',
  '#title' => t('Tags'),
  '#target_type' => $target_type,
  '#selection_handler' => 'default:' . $target_type,
  '#selection_settings' => [
    'target_bundles' => ['tags' => 'tags'],
    'sort' => ['field' => '_none'],
    'auto_create' => FALSE,
    'match_operator' => 'CONTAINS',
  ],
  '#limit' => 10,
  '#size' => 60,
  '#new_terms' => FALSE,
  '#min_length' => 1,
  '#delimiter' => ',',
  '#not_found_message_allow' => FALSE,
];
```

The submitted value is a comma separated list of `Label (id)` pairs, the same
format the core entity autocomplete element uses, so
`EntityAutocomplete::extractEntityIdFromAutocompleteInput()` reads it back.

## Maintainers

- Edward Chan - [edwardchiapet](https://www.drupal.org/u/edwardchiapet)
- Klaus Purer - [klausi](https://www.drupal.org/u/klausi)
- Mohammed Razem - [Mohammed J. Razem](https://www.drupal.org/u/mohammed-j-razem)
- Mike Priscella - [mpriscella](https://www.drupal.org/u/mpriscella)
- Rajab Natshah - [Rajab Natshah](https://www.drupal.org/u/rajab-natshah)
- Sebastian Gilits - [sepgil](https://www.drupal.org/u/sepgil)
