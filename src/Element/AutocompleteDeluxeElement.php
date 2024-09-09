<?php

namespace Drupal\autocomplete_deluxe\Element;

use Drupal\Component\Utility\Html;
use Drupal\Core\Entity\Element\EntityAutocomplete;
use Drupal\Core\Entity\EntityReferenceSelection\SelectionInterface;
use Drupal\Core\Entity\EntityReferenceSelection\SelectionWithAutocreateInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element\CompositeFormElementTrait;
use Drupal\Core\Render\Element\FormElement;

/**
 * Provides an Autocomplete Deluxe Form API element.
 *
 * @FormElement("autocomplete_deluxe")
 */
class AutocompleteDeluxeElement extends FormElement {

  use CompositeFormElementTrait;

  /**
   * {@inheritdoc}
   */
  public function getInfo() {
    $class = get_class($this);

    // Apply default form element properties.
    $info['#target_type'] = NULL;
    $info['#selection_handler'] = 'default';
    $info['#selection_settings'] = [];
    $info['#tags'] = TRUE;
    $info['#autocreate'] = NULL;
    // This should only be set to FALSE if proper validation by the selection
    // handler is performed at another level on the extracted form values.
    $info['#validate_reference'] = TRUE;
    // IMPORTANT! This should only be set to FALSE if the #default_value
    // property is processed at another level (e.g. by a Field API widget) and
    // its value is properly checked for access.
    $info['#process_default_value'] = TRUE;

    $info['#element_validate'] = [
      [
        __CLASS__,
        'validateEntityAutocomplete',
      ],
    ];
    $info['#process'][] = [$class, 'processElement'];

    return $info;
  }

  /**
   * Autocomplete Deluxe element process callback.
   */
  public static function processElement($element) {
    // Do not attach js library if the element is disabled.
    $element_disabled = $element['#disabled'] ?? FALSE;
    if (!$element_disabled) {
      $element['#attached']['library'][] = 'autocomplete_deluxe/assets';

      $active_theme = \Drupal::theme()->getActiveTheme();
      $base_themes = (array) $active_theme->getBaseThemeExtensions();

      if ($active_theme->getName() === 'gin'|| array_key_exists('gin', $base_themes)) {
        // Workaround for problems with jquery css in claro theme.
        $element['#attached']['library'][] = 'autocomplete_deluxe/assets.claro';
        // Overrides to support Gin's CSS3 variables for Darkmode, Accent etc.
        $element['#attached']['library'][] = 'autocomplete_deluxe/assets.gin';
      }
      elseif ($active_theme->getName() === 'claro'|| array_key_exists('claro', $base_themes)) {
        // Workaround for problems with jquery css in claro theme.
        $element['#attached']['library'][] = 'autocomplete_deluxe/assets.claro';
      }
      elseif ($active_theme->getName() == 'seven'|| array_key_exists('seven', $base_themes)) {
        // Workaround for problems with jquery css in seven theme.
        $element['#attached']['library'][] = 'autocomplete_deluxe/assets.seven';
      }
    }

    $html_id = Html::getUniqueId('autocomplete-deluxe-input');

    $element['#after_build'][] = [get_called_class(), 'afterBuild'];

    // Set default options for multiple values.
    $element['#multiple'] = $element['#multiple'] ?? FALSE;

    // Add label_display and label variables to template.
    $element['label'] = ['#theme' => 'form_element_label'];
    $element['label'] += array_intersect_key(
      $element,
      array_flip(
        [
          '#id',
          '#required',
          '#title',
          '#title_display',
        ]
      )
    );

    $element['textfield'] = [
      '#disabled' => $element_disabled,
      '#type' => 'textfield',
      '#size' => $element['#size'] ?? '',
      '#attributes' => [
        'id' => $html_id,
        'aria-label' => $element['#title'] ?? '',
      ],
      '#default_value' => '',
      '#description' => $element['#description'] ?? '',
    ];

    // Add autocomplete deluxe container and class only if element is enabled.
    if (!$element_disabled) {
      $element['textfield']['#prefix'] = '<div class="autocomplete-deluxe-container">';
      $element['textfield']['#suffix'] = '</div>';
      $element['textfield']['#attributes']['class'][] = 'autocomplete-deluxe-form';
    }

    $js_settings[$html_id] = [
      'input_id' => $html_id,
      'multiple' => $element['#multiple'],
      'required' => $element['#required'],
      'limit' => $element['#limit'] ?? 10,
      'min_length' => $element['#min_length'] ?? 0,
      'use_synonyms' => $element['#use_synonyms'] ?? 0,
      'delimiter' => $element['#delimiter'] ?? '',
      'not_found_message_allow' => $element['#not_found_message_allow'] ?? FALSE,
      'not_found_message' => $element['#not_found_message'] ?? "The term '@term' will be added.",
      'new_terms' => $element['#new_terms'] ?? FALSE,
      'no_empty_message' => $element['#no_empty_message'] ?? 'No terms could be found. Please type in order to add a new term.',
    ];

    if (isset($element['#autocomplete_deluxe_path'])) {
      if (isset($element['#default_value'])) {
        // Split on the comma only if that comma has zero, or an even number of
        // quotes in ahead of it.
        // http://stackoverflow.com/questions/1757065/java-splitting-a-comma-separated-string-but-ignoring-commas-in-quotes
        $default_value = preg_replace('/,(?=([^\"]*\"[^\"]*\")*[^\"]*$)/i', '"" ""', $element['#default_value']);
        $default_value = '""' . $default_value . '""';
      }
      else {
        $default_value = '';
      }

      if ($element['#multiple']) {
        $element['value_field'] = [
          '#type' => 'textfield',
          '#attributes' => [
            'class' => ['autocomplete-deluxe-value-field'],
          ],
          '#default_value' => $default_value,
          '#prefix' => '<div class="autocomplete-deluxe-value-container">',
          '#suffix' => '</div>',
          '#description' => $element['#description'] ?? '',
        ];
        $element['textfield']['#attributes']['style'] = ['display: none'];
      }
      else {
        $element['textfield']['#default_value'] = $element['#default_value'] ?? '';
      }

      $js_settings[$html_id] += [
        'type' => 'ajax',
        'uri' => $element['#autocomplete_deluxe_path'],
      ];
    }
    else {
      // If there is no source (path or data), we don't want to add the js
      // settings and so the functions will be aborted.
      return $element;
    }

    // Do not attach js settings if element is disabled.
    if (!$element_disabled) {
      $element['#attached']['drupalSettings']['autocomplete_deluxe'] = $js_settings;
    }
    $element['#tree'] = TRUE;

    return $element;
  }

  /**
   * {@inheritdoc}
   */
  public static function valueCallback(&$element, $input, FormStateInterface $form_state) {
    return [];
  }

  /**
   * Form API after build callback for the duration parameter type form.
   *
   * Fixes up the form value by applying the multiplier.
   */
  public static function afterBuild(array $element, FormStateInterface $form_state) {
    // By default Drupal sets the maxlength to 128 if the property isn't
    // specified, but since the limit isn't useful in some cases,
    // we unset the property.
    unset($element['textfield']['#maxlength']);

    // Set the elements value from either the value field or text field input.
    $element['#value'] = isset($element['value_field']) ? $element['value_field']['#value'] : $element['textfield']['#value'];

    if (isset($element['value_field'])) {
      $element['#value'] = trim($element['#value']);
      // Replace all cases of double double quotes and one or more spaces with a
      // delimiter. This will allow us to keep entries in double quotes.
      $element['#value'] = preg_replace('/"" +""/', $element['#delimiter'] ?? ',', $element['#value']);
      // Remove the double quotes at the beginning and the end from the first
      // and the last term.
      $element['#value'] = substr($element['#value'], 2, strlen($element['#value']) - 4);

      unset($element['value_field']['#maxlength']);
    }

    $form_state->setValueForElement($element, $element['#value']);

    return $element;
  }

  /**
   * Autocomplete validate handler.
   *
   * @see \Drupal\Core\Entity\Element\EntityAutocomplete::validateEntityAutocomplete()
   *   We need to reuse this completely and remove
   *   \Drupal\Component\Utility\Tags usage as we have custom delimiter,
   */
  public static function validateEntityAutocomplete(array &$element, FormStateInterface $form_state, array &$complete_form) {
    $value = NULL;

    if (!empty($element['#value'])) {
      $options = $element['#selection_settings'] + [
        'target_type' => $element['#target_type'],
        'handler' => $element['#selection_handler'],
      ];
      /** @var \Drupal\Core\Entity\EntityReferenceSelection\SelectionInterface $handler */
      $handler = \Drupal::service('plugin.manager.entity_reference_selection')->getInstance($options);
      $autocreate = (bool) $element['#autocreate'] && $handler instanceof SelectionWithAutocreateInterface;

      // GET forms might pass the validated data around on the next request, in
      // which case it will already be in the expected format.
      if (is_array($element['#value'])) {
        $value = $element['#value'];
      }
      else {
        $input_values = $element['#tags']
          ? self::explodeByDelimiter($element['#value'], $element['#delimiter'] ?? ',')
          : [$element['#value']];

        foreach ($input_values as $input) {
          $match = EntityAutocomplete::extractEntityIdFromAutocompleteInput($input);
          if ($match === NULL) {
            // Try to get a match from the input string when the user didn't use
            // the autocomplete but filled in a value manually.
            $match = self::matchEntityByTitle($handler, $input, $element, $form_state, !$autocreate);
          }

          if ($match !== NULL) {
            $value[] = [
              'target_id' => $match,
            ];
          }
          elseif ($autocreate) {
            /** @var \Drupal\Core\Entity\EntityReferenceSelection\SelectionWithAutocreateInterface $handler */
            // Auto-create item. See an example of how this is handled in
            // \Drupal\Core\Field\Plugin\Field\FieldType\EntityReferenceItem::presave().
            $value[] = [
              'entity' => $handler->createNewEntity($element['#target_type'], $element['#autocreate']['bundle'], $input, $element['#autocreate']['uid']),
            ];
          }
        }
      }

      // Check that the referenced entities are valid, if needed.
      if ($element['#validate_reference'] && !empty($value)) {
        // Validate existing entities.
        $ids = array_reduce($value, function ($return, $item) {
          if (isset($item['target_id'])) {
            $return[] = $item['target_id'];
          }
          return $return;
        });

        if ($ids) {
          $valid_ids = $handler->validateReferenceableEntities($ids);
          if ($invalid_ids = array_diff($ids, $valid_ids)) {
            foreach ($invalid_ids as $invalid_id) {
              $form_state->setError($element, t('The referenced entity (%type: %id) does not exist.', [
                '%type' => $element['#target_type'],
                '%id' => $invalid_id,
              ]));
            }
          }
        }

        // Validate newly created entities.
        $new_entities = array_reduce($value, function ($return, $item) {
          if (isset($item['entity'])) {
            $return[] = $item['entity'];
          }
          return $return;
        });

        if ($new_entities) {
          if ($autocreate) {
            $valid_new_entities = $handler->validateReferenceableNewEntities($new_entities);
            $invalid_new_entities = array_diff_key($new_entities, $valid_new_entities);
          }
          else {
            // If the selection handler does not support referencing newly
            // created entities, all of them should be invalidated.
            $invalid_new_entities = $new_entities;
          }

          foreach ($invalid_new_entities as $entity) {
            /** @var \Drupal\Core\Entity\EntityInterface $entity */
            $form_state->setError($element, t('This entity (%type: %label) cannot be referenced.', [
              '%type' => $element['#target_type'],
              '%label' => $entity->label(),
            ]));
          }
        }
      }

      // Use only the last value if the form element does not support multiple
      // matches (tags).
      if (!$element['#tags'] && !empty($value)) {
        $last_value = $value[count($value) - 1];
        $value = $last_value['target_id'] ?? $last_value;
      }
    }

    $form_state->setValueForElement($element, $value);
  }

  /**
   * Copy of the method that allows custom delimiter.
   *
   * @param string $tags
   *   A string to explode.
   * @param string $delimiter
   *   A delimiter to explode by.
   *
   * @see \Drupal\Component\Utility\Tags::explode()
   */
  public static function explodeByDelimiter(string $tags, string $delimiter) {
    $regexp = '%(?:^|' . preg_quote($delimiter) . '\ *)("(?>[^"]*)(?>""[^"]* )*"|(?: [^"' . preg_quote($delimiter) . ']*))%x';
    preg_match_all($regexp, $tags, $matches);
    $typed_tags = array_unique($matches[1]);

    $tags = [];
    foreach ($typed_tags as $tag) {
      // If a user has escaped a term (to demonstrate that it is a group,
      // or includes a comma or quote character), we remove the escape
      // formatting so to save the term into the database as the user intends.
      $tag = trim(str_replace('""', '"', preg_replace('/^"(.*)"$/', '\1', $tag)));
      if ($tag != "") {
        $tags[] = $tag;
      }
    }

    return $tags;
  }

  /**
   * Copy of protected method we need to use in validation handler.
   *
   * @see \Drupal\Core\Entity\Element\EntityAutocomplete::matchEntityByTitle()
   */
  protected static function matchEntityByTitle(SelectionInterface $handler, $input, array &$element, FormStateInterface $form_state, $strict) {
    $entities_by_bundle = $handler->getReferenceableEntities($input, '=', 6);
    $entities = array_reduce($entities_by_bundle, function ($flattened, $bundle_entities) {
      return $flattened + $bundle_entities;
    }, []);
    $params = [
      '%value' => $input,
      '@value' => $input,
      '@entity_type_plural' => \Drupal::entityTypeManager()->getDefinition($element['#target_type'])->getPluralLabel(),
    ];
    if (empty($entities)) {
      if ($strict) {
        // Error if there are no entities available for a required field.
        $form_state->setError($element, t('There are no @entity_type_plural matching "%value".', $params));
      }
    }
    elseif (count($entities) > 5) {
      $params['@id'] = key($entities);
      // Error if there are more than 5 matching entities.
      $form_state->setError($element, t('Many @entity_type_plural are called %value. Specify the one you want by appending the id in parentheses, like "@value (@id)".', $params));
    }
    elseif (count($entities) > 1) {
      // More helpful error if there are only a few matching entities.
      $multiples = [];
      foreach ($entities as $id => $name) {
        $multiples[] = $name . ' (' . $id . ')';
      }
      $params['@id'] = $id;
      $form_state->setError($element, t('Multiple @entity_type_plural match this reference; "%multiple". Specify the one you want by appending the id in parentheses, like "@value (@id)".', ['%multiple' => strip_tags(implode('", "', $multiples))] + $params));
    }
    else {
      // Take the one and only matching entity.
      return key($entities);
    }
  }

}
