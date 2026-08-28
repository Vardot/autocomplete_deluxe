<?php

declare(strict_types=1);

namespace Drupal\Tests\autocomplete_deluxe\Unit;

use Drupal\autocomplete_deluxe\Element\AutocompleteDeluxeElement;
use Drupal\Tests\UnitTestCase;

/**
 * Tests the admin-theme styling library detection.
 *
 * Covers the Gin contrib theme (Drupal 10/11) and the Gin-based "Default Admin"
 * (default_admin) theme that ships in Drupal core (12+) for Issue #3591908.
 *
 * @coversDefaultClass \Drupal\autocomplete_deluxe\Element\AutocompleteDeluxeElement
 *
 * @group autocomplete_deluxe
 */
class ThemeStylingLibrariesTest extends UnitTestCase {

  /**
   * @covers ::themeStylingLibraries
   *
   * @dataProvider providerThemeStylingLibraries
   */
  public function testThemeStylingLibraries(string $theme_name, array $base_theme_names, array $expected): void {
    $this->assertSame(
      $expected,
      AutocompleteDeluxeElement::themeStylingLibraries($theme_name, $base_theme_names)
    );
  }

  /**
   * Data provider for ::testThemeStylingLibraries().
   *
   * @return array[]
   *   Sets of [theme_name, base_theme_names, expected libraries].
   */
  public static function providerThemeStylingLibraries(): array {
    $gin = ['autocomplete_deluxe/assets.claro', 'autocomplete_deluxe/assets.gin'];
    $claro = ['autocomplete_deluxe/assets.claro'];
    $seven = ['autocomplete_deluxe/assets.seven'];

    return [
      'gin contrib theme' => ['gin', [], $gin],
      'default_admin core theme' => ['default_admin', [], $gin],
      'sub-theme of gin' => ['my_gin', ['gin'], $gin],
      'sub-theme of default_admin' => ['my_admin', ['default_admin'], $gin],
      'claro theme' => ['claro', [], $claro],
      'sub-theme of claro' => ['my_claro', ['claro'], $claro],
      'seven theme' => ['seven', [], $seven],
      'sub-theme of seven' => ['my_seven', ['seven'], $seven],
      'olivero front-end theme' => ['olivero', [], []],
      'stark theme' => ['stark', [], []],
    ];
  }

}
