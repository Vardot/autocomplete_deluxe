<?php

namespace Drupal\autocomplete_deluxe\Controller;

use Drupal\Component\Plugin\Exception\PluginNotFoundException;
use Drupal\Component\Utility\Crypt;
use Drupal\Component\Utility\Tags;
use Drupal\Core\Site\Settings;
use Drupal\system\Controller\EntityAutocompleteController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Defines a route controller for entity autocomplete form elements.
 */
class AutocompleteDeluxeController extends EntityAutocompleteController {

  /**
   * {@inheritdoc}
   */
  public function handleAutocomplete(Request $request, $target_type, $selection_handler, $selection_settings_key) {
    $matches = [];
    // Get the typed string from the URL, if it exists.
    $input = trim($request->query->get('q'));
    if (!empty($input)) {
      $typed_string = Tags::explode($input);
      $typed_string = array_pop($typed_string);
    }
    else {
      // Select without entering something.
      $typed_string = '';
    }

    // Selection settings are passed in as a hashed key of a serialized array
    // stored in the key/value store.
    $selection_settings = $this->keyValue->get($selection_settings_key, FALSE);
    if ($selection_settings !== FALSE) {
      $selection_settings_hash = Crypt::hmacBase64(serialize($selection_settings) . $target_type . $selection_handler, Settings::getHashSalt());
      if ($selection_settings_hash !== $selection_settings_key) {
        // Disallow access when the selection settings hash does not match the
        // passed-in key.
        throw new AccessDeniedHttpException('Invalid selection settings key.');
      }
    }
    else {
      // Disallow access when the selection settings key is not found in the
      // key/value store.
      throw new AccessDeniedHttpException();
    }

    // The entity being edited, so a selection plugin can act on it, for
    // example to leave the entity itself out of its own suggestions. The
    // parameters ride outside the hashed settings, so the entity is only
    // taken when it loads and the user may view it.
    $entity_type = $request->query->get('entity_type');
    $entity_id = $request->query->get('entity_id');
    if ($entity_type && $entity_id) {
      try {
        $entity = $this->entityTypeManager()->getStorage($entity_type)->load($entity_id);
      }
      catch (PluginNotFoundException $e) {
        $entity = NULL;
      }
      if ($entity && $entity->access('view')) {
        $selection_settings['entity'] = $entity;
      }
    }

    $matches = $this->matcher->getMatches($target_type, $selection_handler, $selection_settings, $typed_string);

    $items = [];
    foreach ($matches as $item) {
      $items[$item['value']] = $item['label'];
    }

    // The matcher returns its results alphabetically, so a term that merely
    // contains what was typed can outrank the one that starts with it. Bring
    // the terms that start with the typed string to the front, keeping the
    // matcher's own order inside each group.
    if ($typed_string !== '') {
      $starts = [];
      $contains = [];
      foreach ($items as $value => $label) {
        if (stripos((string) $label, $typed_string) === 0) {
          $starts[$value] = $label;
        }
        else {
          $contains[$value] = $label;
        }
      }
      $items = $starts + $contains;
    }

    // Show each term with its parents, so the same name under different
    // parents can be told apart. The label alone changes; the value that is
    // stored stays what it was.
    //
    // This runs after the ordering above, deliberately: the prefix would put
    // the parent's name at the front of the label, and a term whose own name
    // starts with the typed string would then no longer be seen to start with
    // it. Ordering stays on the term's own name; the prefix is display only.
    if (!empty($selection_settings['autocomplete_deluxe_hierarchy']) && $target_type === 'taxonomy_term') {
      $storage = $this->entityTypeManager()->getStorage('taxonomy_term');
      foreach ($items as $value => $label) {
        if (preg_match('/\((\d+)\)$/', (string) $value, $found)) {
          $parents = $storage->loadAllParents($found[1]);
          // The chain comes child first and includes the term itself.
          array_shift($parents);
          if ($parents) {
            $names = array_reverse(array_map(static fn ($term) => $term->label(), $parents));
            $items[$value] = implode(' » ', $names) . ' » ' . $label;
          }
        }
      }
    }

    $matches = $items;

    return new JsonResponse($matches);
  }

}
