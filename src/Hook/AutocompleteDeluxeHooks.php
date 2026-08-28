<?php

declare(strict_types=1);

namespace Drupal\autocomplete_deluxe\Hook;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Routing\RouteMatchInterface;

/**
 * Hook implementations for the Autocomplete Deluxe module.
 *
 * Object-oriented (attribute-based) hooks are discovered by Drupal core from
 * 11.1 onward. On Drupal 10 and 11.0 - which have no OOP hook support - the
 * procedural wrapper in autocomplete_deluxe.module runs instead and delegates
 * here, so the implementation lives in one place on every supported version.
 * The procedural wrapper carries the #[LegacyHook] attribute so it is skipped
 * (not double-invoked) once core discovers this class.
 */
final class AutocompleteDeluxeHooks {

  public function __construct(
    private readonly ModuleHandlerInterface $moduleHandler,
    private readonly ConfigFactoryInterface $configFactory,
  ) {}

  /**
   * Implements hook_help().
   */
  #[Hook('help')]
  public function help(string $route_name, RouteMatchInterface $route_match): string {
    if ($route_name !== 'help.page.autocomplete_deluxe') {
      return '';
    }

    $text = file_get_contents(dirname(__DIR__, 2) . '/README.md');
    if (!$this->moduleHandler->moduleExists('markdown')) {
      return '<pre>' . $text . '</pre>';
    }

    // Use the Markdown filter to render the README. The filter plugin manager is
    // fetched lazily (only when the optional Markdown module is present) so the
    // module does not take a hard dependency on the core Filter module.
    // @phpstan-ignore-next-line
    $filter_manager = \Drupal::service('plugin.manager.filter');
    $settings = $this->configFactory->get('markdown.settings')->getRawData();
    $filter = $filter_manager->createInstance('markdown', ['settings' => $settings]);
    return (string) $filter->process($text, 'en');
  }

}
