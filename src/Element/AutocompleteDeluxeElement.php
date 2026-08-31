<?php

namespace Drupal\autocomplete_deluxe\Element;

use Drupal\Component\Utility\Html;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element\CompositeFormElementTrait;
use Drupal\Core\Render\Element\FormElementBase;
use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * Provides an Autocomplete Deluxe Form API element.
 *
 * @FormElement("autocomplete_deluxe")
 */
class AutocompleteDeluxeElement extends FormElementBase {

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
      [$class, 'validateRequired'],
      ['\Drupal\Core\Entity\Element\EntityAutocomplete', 'validateEntityAutocomplete'],
    ];
    $info['#process'][] = [$class, 'processElement'];

    return $info;
  }

  /**
   * Resolves the admin-theme styling libraries for the active theme.
   *
   * Kept as a pure, side-effect-free helper so the theme detection can be
   * unit tested without bootstrapping the theme system.
   *
   * @param string $theme_name
   *   The active theme machine name.
   * @param string[] $base_theme_names
   *   The active theme's base theme machine names.
   *
   * @return string[]
   *   The styling libraries to attach, in attach order.
   */
  public static function themeStylingLibraries($theme_name, array $base_theme_names = []) {
    // Gin ships as the contrib theme on Drupal 10 and 11 and as the Gin-based
    // Default Admin theme in core from Drupal 12, and both share the markup and
    // the CSS variables these overrides rely on.
    $is_gin = in_array($theme_name, ['gin', 'default_admin'], TRUE)
      || in_array('gin', $base_theme_names, TRUE)
      || in_array('default_admin', $base_theme_names, TRUE);

    if ($is_gin) {
      return ['autocomplete_deluxe/assets.claro', 'autocomplete_deluxe/assets.gin'];
    }
    if ($theme_name === 'claro' || in_array('claro', $base_theme_names, TRUE)) {
      return ['autocomplete_deluxe/assets.claro'];
    }
    if ($theme_name === 'seven' || in_array('seven', $base_theme_names, TRUE)) {
      return ['autocomplete_deluxe/assets.seven'];
    }
    return [];
  }

  /**
   * Says which field is missing, rather than leaving it to the constraint.
   *
   * The element carries no input of its own that the form API can check, so an
   * empty required field failed later, on the entity, where the message reads
   * "This value should not be null."
   */
  public static function validateRequired(array &$element, FormStateInterface $form_state, array &$complete_form) {
    if (empty($element['#required'])) {
      return;
    }

    // Every value is wrapped in double quotes, so an empty field is an empty
    // string or a pair of quotes.
    $value = trim((string) ($element['#value'] ?? ''));
    if ($value === '' || $value === '""') {
      $form_state->setError($element, new TranslatableMarkup('@name field is required.', [
        '@name' => $element['#title'] ?? '',
      ]));
    }
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
      $base_theme_names = array_keys((array) $active_theme->getBaseThemeExtensions());
      foreach (self::themeStylingLibraries($active_theme->getName(), $base_theme_names) as $library) {
        $element['#attached']['library'][] = $library;
      }
    }

    $html_id = Html::getUniqueId('autocomplete-deluxe-input');

    $element['#after_build'][] = [get_called_class(), 'afterBuild'];

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
      // The field widget always sets these; a custom form using the element
      // directly may not, so fall back to no limit and not required.
      'cardinality' => $element['#cardinality'] ?? 0,
      'required' => $element['#required'] ?? FALSE,
      'limit' => $element['#limit'] ?? 10,
      'min_length' => $element['#min_length'] ?? 0,
      'use_synonyms' => $element['#use_synonyms'] ?? 0,
      'delimiter' => $element['#delimiter'] ?? '',
      'not_found_message_allow' => $element['#not_found_message_allow'] ?? FALSE,
      'not_found_message' => $element['#not_found_message'] ?? "'@term' will be added.",
      'new_terms' => $element['#new_terms'] ?? FALSE,
      'show_entity_id' => $element['#show_entity_id'] ?? FALSE,
      'select_all' => $element['#select_all'] ?? FALSE,
      'select_all_label' => $element['#select_all_label'] ?? (string) t('Add every suggestion'),
      'link_tags' => $element['#link_tags'] ?? FALSE,
      'link_template' => $element['#link_template'] ?? '',
      'link_placeholder' => $element['#link_placeholder'] ?? '',
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

      if (isset($element['#autocomplete_query_parameters'])) {
        $js_settings[$html_id]['query_parameters'] = $element['#autocomplete_query_parameters'];
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

      // Replace all cases of (2 or) 3 quotes with 1 double quote.
      $element['#value'] = preg_replace('/^"{2,3}|"{2,3}$/', '"', $element['#value']);
      $element['#value'] = preg_replace('/"{2,3} +"/', '" "', $element['#value']);
      $element['#value'] = preg_replace('/" +"{2,3}/', '" "', $element['#value']);

      // Make comma delimited.
      $element['#value'] = preg_replace('/" +"/', '","', $element['#value']);

      if (substr($element['#value'], 0, 3) == '","') {
        $element['#value'] = substr($element['#value'], 2);
      }

      // Remove the double quotes at the beginning and the end from the first
      // and the last term.
      $element['#value'] = '"' . trim($element['#value'], '"') . '"';

      unset($element['value_field']['#maxlength']);
    }

    $form_state->setValueForElement($element, $element['#value']);

    return $element;
  }

}
