<?php

namespace Drupal\autocomplete_deluxe\Plugin\Field\FieldWidget;

use Drupal\Component\Utility\Crypt;
use Drupal\Core\Entity\EntityReferenceSelection\SelectionPluginManagerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Field\Attribute\FieldWidget;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\KeyValueStore\KeyValueFactoryInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Site\Settings;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\TypedData\TranslatableInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Url;
use Drupal\user\EntityOwnerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Config\Entity\ThirdPartySettingsInterface;
use Drupal\Core\Session\AccountInterface;

/**
 * Plugin implementation of the 'autocomplete_deluxe' widget.
 */
#[FieldWidget(
  id: 'autocomplete_deluxe',
  label: new TranslatableMarkup('Autocomplete Deluxe'),
  field_types: ['entity_reference'],
  multiple_values: TRUE,
)]
class AutocompleteDeluxeWidget extends WidgetBase implements ContainerFactoryPluginInterface {

  use StringTranslationTrait;

  /**
   * The module handler.
   *
   * @var \Drupal\Core\Extension\ModuleHandlerInterface
   */
  protected $moduleHandler;

  /**
   * Current Account Interface.
   *
   * @var \Drupal\Core\Session\AccountInterface
   */
  protected $account;

  /**
   * Key value service.
   *
   * @var \Drupal\Core\KeyValueStore\KeyValueFactoryInterface
   */
  protected $keyValue;

  /**
   * The selection plugin manager.
   *
   * @var \Drupal\Core\Entity\EntityReferenceSelection\SelectionPluginManagerInterface
   */
  protected $selectionManager;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * {@inheritdoc}
   *
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Field\FieldDefinitionInterface $field_definition
   *   The field definition for the operation.
   * @param array $settings
   *   The formatter settings.
   * @param array $third_party_settings
   *   Any third party settings.
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $module_handler
   *   The module handler.
   * @param \Drupal\Core\Session\AccountInterface $account
   *   Current account.
   * @param \Drupal\Core\KeyValueStore\KeyValueFactoryInterface $key_value
   *   Key value storage.
   * @param \Drupal\Core\Entity\EntityReferenceSelection\SelectionPluginManagerInterface $selection_manager
   *   The selection plugin manager.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   */
  public function __construct($plugin_id, $plugin_definition, FieldDefinitionInterface $field_definition, array $settings, array $third_party_settings, ModuleHandlerInterface $module_handler, AccountInterface $account, KeyValueFactoryInterface $key_value, SelectionPluginManagerInterface $selection_manager, EntityTypeManagerInterface $entity_type_manager) {
    parent::__construct($plugin_id, $plugin_definition, $field_definition, $settings, $third_party_settings);

    $this->moduleHandler = $module_handler;
    $this->account = $account;
    $this->keyValue = $key_value;
    $this->selectionManager = $selection_manager;
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $plugin_id,
      $plugin_definition,
      $configuration['field_definition'],
      $configuration['settings'],
      $configuration['third_party_settings'],
      $container->get('module_handler'),
      $container->get('current_user'),
      $container->get('keyvalue'),
      $container->get('plugin.manager.entity_reference_selection'),
      $container->get('entity_type.manager')
    );
  }

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings() {
    return [
      'match_operator' => 'CONTAINS',
      'autocomplete_route_name' => 'autocomplete_deluxe.autocomplete',
      'size' => 60,
      'selection_handler' => 'default',
      'selection_handler_override' => '',
      'match_limit' => 10,
      'min_length' => 0,
      'delimiter' => '',
      'not_found_message_allow' => FALSE,
      'not_found_message' => "'@term' will be added",
      'new_terms' => FALSE,
      'show_entity_id' => FALSE,
      'no_empty_message' => 'No terms could be found. Please type in order to add a new term.',
      'show_term_hierarchy' => FALSE,
      'select_all' => FALSE,
    ] + parent::defaultSettings();
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state) {
    $element['match_operator'] = [
      '#type' => 'select',
      '#title' => $this->t('Match operator'),
      '#description' => $this->t('Specify the matching operator.'),
      '#default_value' => $this->getSetting('match_operator'),
      '#options' => $this->getMatchOperatorOptions(),
    ];
    $element['match_limit'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Limit of the output.'),
      '#description' => $this->t('If set to zero no limit will be used'),
      '#default_value' => $this->getSetting('match_limit'),
      '#element_validate' => [[get_class($this), 'validateInteger']],
    ];
    $element['min_length'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Minimum length.'),
      '#description' => $this->t('The minimum length of characters to enter to open the suggestion list.'),
      '#default_value' => $this->getSetting('min_length'),
      '#element_validate' => [[get_class($this), 'validateInteger']],
    ];
    $element['delimiter'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Delimiter.'),
      '#description' => $this->t('A character which should be used beside the enter key, to separate the values.'),
      '#default_value' => $this->getSetting('delimiter'),
      '#size' => 1,
    ];
    $element['not_found_message_allow'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show the not found message'),
      '#description' => $this->t('If this is enabled, a message will be displayed when nothing was found for what was typed.'),
      '#default_value' => $this->getSetting('not_found_message_allow'),
    ];
    $element['not_found_message'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Not found message.'),
      '#description' => $this->t('A message text which will be displayed, if nothing was found for what was entered. @term is replaced with what was typed.'),
      '#default_value' => $this->getSetting('not_found_message'),
    ];
    $element['new_terms'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Allow new values'),
      '#description' => $this->t('Should a user be allowed to enter a value that does not exist yet? The referenced entity type decides what is created, so this is a new term for a vocabulary and a new entity for any other type.'),
      '#default_value' => $this->getSetting('new_terms'),
    ];

    $target_type = $this->fieldDefinition->getFieldStorageDefinition()->getSetting('target_type');
    $handler_options = ['' => $this->t('- Field default -')];
    foreach (array_keys($this->selectionManager->getSelectionGroups($target_type)) as $group) {
      $handler_options[$group] = $group;
    }
    $element['selection_handler_override'] = [
      '#type' => 'select',
      '#title' => $this->t('Selection handler'),
      '#description' => $this->t('Suggest through this handler instead of the one of the field. The handler settings of the field are kept, so the handler has to make sense with them.'),
      '#options' => $handler_options,
      '#default_value' => $this->getSetting('selection_handler_override'),
    ];
    $element['show_entity_id'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show the entity ID'),
      '#description' => $this->t('Keep the entity ID beside the label, which tells two entities with the same name apart.'),
      '#default_value' => $this->getSetting('show_entity_id'),
    ];
    $element['show_term_hierarchy'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show the parent hierarchy'),
      '#description' => $this->t('Show each suggested term with its parents, which tells the same name under different parents apart. Taxonomy only.'),
      '#default_value' => $this->getSetting('show_term_hierarchy'),
    ];
    $element['select_all'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Offer a select all row'),
      '#description' => $this->t('Put a row above the suggestions that adds every suggestion at once. Only a field that holds an unlimited number of values offers it, since a limited field cannot take them all.'),
      '#default_value' => $this->getSetting('select_all'),
    ];
    $element['no_empty_message'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Empty value message.'),
      '#description' => $this->t('A text message that will be displayed when the field is focused and it does not contain values.'),
      '#default_value' => $this->getSetting('no_empty_message'),
    ];

    return $element;
  }

  /**
   * {@inheritdoc}
   */
  public function settingsSummary() {
    $summary = [];

    $summary[] = $this->t('Match operator: @match_operator', ['@match_operator' => $this->getSetting('match_operator')]);
    $summary[] = $this->t('Limit: @match_limit', ['@match_limit' => $this->getSetting('match_limit')]);
    $summary[] = $this->t('Min length: @min_length', ['@min_length' => $this->getSetting('min_length')]);
    $summary[] = $this->t('Delimiter: @delimiter', ['@delimiter' => $this->getSetting('delimiter')]);
    $summary[] = $this->t('Allow not found message: @not_found_message_allow', ['@not_found_message_allow' => $this->getSetting('not_found_message_allow') ? 'Yes' : 'No']);
    $summary[] = $this->t('Not found message: @not_found_message', ['@not_found_message' => $this->getSetting('not_found_message')]);
    $summary[] = $this->t('Allow new values: @new_terms', ['@new_terms' => $this->getSetting('new_terms') ? 'Yes' : 'No']);
    if ($this->getSetting('selection_handler_override') !== '') {
      $summary[] = $this->t('Selection handler: @selection_handler', ['@selection_handler' => $this->getSetting('selection_handler_override')]);
    }
    $summary[] = $this->t('Show the entity ID: @show_entity_id', ['@show_entity_id' => $this->getSetting('show_entity_id') ? 'Yes' : 'No']);
    $summary[] = $this->t('Show the parent hierarchy: @show_term_hierarchy', ['@show_term_hierarchy' => $this->getSetting('show_term_hierarchy') ? 'Yes' : 'No']);
    $summary[] = $this->t('Offer a select all row: @select_all', ['@select_all' => $this->getSetting('select_all') ? 'Yes' : 'No']);
    $summary[] = $this->t('Empty value message: @no_empty_message', ['@no_empty_message' => $this->getSetting('no_empty_message')]);

    return $summary;
  }

  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state) {
    $entity = $items->getEntity();
    $instance = $this->fieldDefinition;
    $cardinality = $instance->getFieldStorageDefinition()->getCardinality();

    // A module can narrow the number of values for a single field rather than
    // for the whole storage, which is what Field Config Cardinality does, so
    // the widget follows that value when it is set.
    if ($instance instanceof ThirdPartySettingsInterface) {
      $field_cardinality = $instance->getThirdPartySetting('field_config_cardinality', 'cardinality_config');
      if ($field_cardinality !== NULL && $field_cardinality !== '') {
        $cardinality = (int) $field_cardinality;
      }
    }
    $target_type = $instance->getFieldStorageDefinition()->getSetting('target_type');
    $settings = $this->getSettings();
    $referenced_entities = $items->referencedEntities();

    $selection_settings = $this->getFieldSetting('handler_settings') + ['match_operator' => $this->getSetting('match_operator')];

    $allow_message = $settings['not_found_message_allow'] ?? FALSE;
    $not_found_message = $settings['not_found_message'] ?? "";
    $selection_settings['match_limit'] = isset($settings['match_limit']) ? $settings['match_limit'] : 10;

    // Rides inside the hashed settings, so the flag reaches the controller
    // and stays one key per field in the store.
    if (!empty($settings['show_term_hierarchy'])) {
      $selection_settings['autocomplete_deluxe_hierarchy'] = TRUE;
    }

    // New terms are only offered to a user who may create them, so the widget
    // follows the create permission of the referenced entity type instead of
    // offering a value the save would refuse.
    $autocreate_bundle = $this->getAutocreateBundle();
    $new_terms = ($settings['new_terms'] ?? FALSE) && $autocreate_bundle
      && $this->entityTypeManager
        ->getAccessControlHandler($target_type)
        ->createAccess($autocreate_bundle, $this->account);

    $element += [
      '#type' => 'autocomplete_deluxe',
      '#title' => $this->fieldDefinition->getLabel(),
      '#target_type' => $target_type,
      '#selection_handler' => !empty($settings['selection_handler_override']) ? $settings['selection_handler_override'] : $this->getFieldSetting('handler'),
      // The entity being edited stays in the settings whichever handler runs,
      // so an overriding plugin can filter on it too.
      '#selection_settings' => $selection_settings + [
        'entity' => $entity,
      ],
      '#size' => 60,
      '#match_limit' => $settings['match_limit'] ?? 10,
      '#min_length' => $settings['min_length'] ?? 0,
      '#delimiter' => $settings['delimiter'] ?? '',
      '#not_found_message_allow' => $allow_message,
      '#not_found_message' => $this->t('@not_found_message', ['@not_found_message' => $not_found_message]),
      '#new_terms' => $new_terms,
      '#show_entity_id' => $settings['show_entity_id'] ?? FALSE,
      // A field that takes a limited number of values cannot take every
      // suggestion, so the row is only offered where the field is unlimited.
      '#select_all' => !empty($settings['select_all']) && $cardinality <= 0,
      '#no_empty_message' => isset($settings['no_empty_message']) ? $this->t('@no_empty_message', ['@no_empty_message' => $settings['no_empty_message']]) : '',
      '#cardinality' => $cardinality,
    ];

    // If new terms are allowed to be created, set the bundle and the uid of the
    // term.
    if ($new_terms && $this->getSelectionHandlerSetting('auto_create')) {
      $element['#autocreate'] = [
        'bundle' => $autocreate_bundle,
        'uid' => ($entity instanceof EntityOwnerInterface) ? $entity->getOwnerId() : $this->account->id(),
      ];
    }

    // Show every tag in the language of the entity being edited. Core hands
    // the referenced entities back in their own language, see
    // https://www.drupal.org/project/drupal/issues/2915972.
    $langcode = $entity->language()->getId();

    $entities = [];
    foreach ($referenced_entities as $item) {
      if ($item instanceof TranslatableInterface && $item->hasTranslation($langcode)) {
        $item = $item->getTranslation($langcode);
      }
      $entities[$item->id()] = $item;
    }

    // The hash and the stored settings deliberately leave the entity out, so
    // one field keeps one key in the store whatever entity is being edited.
    $data = serialize($selection_settings) . $element['#target_type'] . $element['#selection_handler'];
    $selection_settings_key = Crypt::hmacBase64($data, Settings::getHashSalt());

    $key_value_storage = $this->keyValue->get('entity_autocomplete');
    if (!$key_value_storage->has($selection_settings_key)) {
      $key_value_storage->set($selection_settings_key, $selection_settings);
    }

    $route_parameters = [
      'target_type' => $target_type,
      'selection_handler' => $element['#selection_handler'],
      'selection_settings_key' => $selection_settings_key,
    ];

    if (!$entity->isNew()) {
      $element['#autocomplete_query_parameters']['entity_type'] = $entity->getEntityTypeId();
      $element['#autocomplete_query_parameters']['entity_id'] = $entity->id();
    }

    $element += [
      '#autocomplete_deluxe_path' => Url::fromRoute('autocomplete_deluxe.autocomplete', $route_parameters, ['absolute' => TRUE])->getInternalPath(),
      '#default_value' => self::implodeEntities($entities),
    ];

    return ['target_id' => $element];
  }

  /**
   * Implodes the tags from the taxonomy module.
   *
   * @param \Drupal\Core\Entity\EntityInterface[] $entities
   *   List of entities.
   * @param string $bundle
   *   Bundle name.
   *
   * @return array
   *   Imploded list of entity labels.
   */
  public static function implodeEntities(array $entities, $bundle = NULL) {
    $typed_entities = [];
    foreach ($entities as $entity) {
      $label = "{$entity->label()} ({$entity->id()})";

      // Extract entities belonging to the bundle in question.
      if (!isset($bundle) || $entity->bundle() == $bundle) {
        // Make sure we have a completed loaded entity.
        if ($entity && $label) {
          // Commas and quotes in tag names are special cases, so encode 'em.
          if (strpos($label, ',') !== FALSE || strpos($label, '"') !== FALSE) {
            $label = '"' . str_replace('"', '""', $label) . '"';
          }

          $typed_entities[] = $label;
        }
      }
    }

    return implode(',', $typed_entities);
  }

  /**
   * {@inheritdoc}
   */
  public function massageFormValues(array $values, array $form, FormStateInterface $form_state) {
    // A module can wrap the widget in one more level, as Field States UI
    // does under the element key, so the values are taken from wherever the
    // target_id landed.
    if (!isset($values['target_id']) && isset($values['element']['target_id'])) {
      return $values['element']['target_id'];
    }
    return $values['target_id'];
  }

  /**
   * Form element validation handler for integer textfields.
   */
  public static function validateInteger(&$element, FormStateInterface $form_state, &$complete_form) {
    $value = $element['#value'];
    if ($value !== '' && (!is_numeric($value) || intval($value) != $value)) {
      $form_state->setError($element, \Drupal::translation()->translate('%name must be an integer.', ['%name' => $element['#title']]));
    }
  }

  /**
   * Form element validation handler for positive integer textfields.
   */
  public static function validateIntegerPositive(&$element, FormStateInterface $form_state, &$complete_form) {
    $value = $element['#value'];
    if ($value !== '' && (!is_numeric($value) || intval($value) != $value || $value <= 0)) {
      $form_state->setError($element, \Drupal::translation()->translate('%name must be a positive integer.', ['%name' => $element['#title']]));
    }
  }

  /**
   * Returns the name of the bundle which will be used for autocreated entities.
   *
   * @return string
   *   The bundle name.
   */
  protected function getAutocreateBundle() {
    $bundle = NULL;

    if ($this->getSelectionHandlerSetting('auto_create') && $target_bundles = $this->getSelectionHandlerSetting('target_bundles')) {
      // If there's only one target bundle, use it.
      if (count($target_bundles) == 1) {
        $bundle = reset($target_bundles);
      }
      // Otherwise use the target bundle stored in selection handler settings.
      elseif (!$bundle = $this->getSelectionHandlerSetting('auto_create_bundle')) {
        // If no bundle has been set as auto create target means that there is
        // an inconsistency in entity reference field settings.
        trigger_error(sprintf(
          "The 'Create referenced entities if they don't already exist' option is enabled but a specific destination bundle is not set. You should re-visit and fix the settings of the '%s' (%s) field.",
          $this->fieldDefinition->getLabel(),
          $this->fieldDefinition->getName()
        ), E_USER_WARNING);
      }
    }

    return $bundle;
  }

  /**
   * Returns the value of a setting for the entity reference selection handler.
   *
   * @param string $setting_name
   *   The setting name.
   *
   * @return mixed
   *   The setting value.
   */
  protected function getSelectionHandlerSetting($setting_name) {
    $settings = $this->getFieldSetting('handler_settings');
    return $settings[$setting_name] ?? NULL;
  }

  /**
   * Returns the options for the match operator.
   *
   * @return array
   *   List of options.
   */
  protected function getMatchOperatorOptions() {
    return [
      'STARTS_WITH' => $this->t('Starts with'),
      'CONTAINS' => $this->t('Contains'),
    ];
  }

}
