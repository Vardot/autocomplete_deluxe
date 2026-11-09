<?php

declare(strict_types=1);

namespace Drupal\Tests\autocomplete_deluxe\Kernel;

use Drupal\autocomplete_deluxe\Element\AutocompleteDeluxeElement;
use Drupal\KernelTests\KernelTestBase;
use Drupal\taxonomy\Entity\Term;
use Drupal\taxonomy\Entity\Vocabulary;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that the element owns the settings store and the autocomplete route.
 *
 * @coversDefaultClass \Drupal\autocomplete_deluxe\Element\AutocompleteDeluxeElement
 *
 * @group autocomplete_deluxe
 */
#[RunTestsInSeparateProcesses]
class AutocompletePathTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'system',
    'user',
    'field',
    'filter',
    'text',
    'taxonomy',
    'autocomplete_deluxe',
  ];

  /**
   * The settings a field would hand over.
   *
   * @var array
   */
  protected $settings = [
    'target_bundles' => ['acd_tags' => 'acd_tags'],
    'sort' => ['field' => '_none'],
    'auto_create' => FALSE,
    'match_operator' => 'CONTAINS',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->installEntitySchema('taxonomy_term');
    $this->installEntitySchema('user');
    $this->installConfig(['taxonomy']);

    Vocabulary::create(['vid' => 'acd_tags', 'name' => 'ACD Tags'])->save();
  }

  /**
   * Reads the key out of the path the helper built.
   *
   * @param string $path
   *   The path the helper returned.
   *
   * @return string
   *   The last segment, which carries the key.
   */
  protected function keyFromPath($path) {
    $parts = explode('/', $path);
    return end($parts);
  }

  /**
   * The path names the route and carries the key of the stored settings.
   *
   * @covers ::autocompletePath
   */
  public function testThePathCarriesTheStoredSettings(): void {
    $path = AutocompleteDeluxeElement::autocompletePath('taxonomy_term', 'default:taxonomy_term', $this->settings);

    $this->assertStringContainsString('autocomplete_deluxe/taxonomy_term/default:taxonomy_term/', $path);

    $stored = \Drupal::keyValue('entity_autocomplete')->get($this->keyFromPath($path));
    $this->assertSame($this->settings, $stored, 'The settings were put in the store under the key in the path.');
  }

  /**
   * The same settings give the same key, so the store does not grow.
   *
   * @covers ::autocompletePath
   */
  public function testTheSameSettingsGiveTheSameKey(): void {
    $first = AutocompleteDeluxeElement::autocompletePath('taxonomy_term', 'default:taxonomy_term', $this->settings);
    $second = AutocompleteDeluxeElement::autocompletePath('taxonomy_term', 'default:taxonomy_term', $this->settings);

    $this->assertSame($first, $second);
    $this->assertCount(1, \Drupal::keyValue('entity_autocomplete')->getAll());
  }

  /**
   * The entity being edited changes neither the key nor what is stored.
   *
   * The element carries the entity in its selection settings so a selection
   * plugin can filter on it, see issue #3268207. Hashing it would put a key in
   * the store for every entity anyone opens, so it is taken out first.
   *
   * @covers ::autocompletePath
   */
  public function testTheEntityIsLeftOutOfTheKey(): void {
    $plain = AutocompleteDeluxeElement::autocompletePath('taxonomy_term', 'default:taxonomy_term', $this->settings);

    $one = Term::create(['name' => 'One', 'vid' => 'acd_tags']);
    $one->save();
    $two = Term::create(['name' => 'Two', 'vid' => 'acd_tags']);
    $two->save();

    $with_one = AutocompleteDeluxeElement::autocompletePath('taxonomy_term', 'default:taxonomy_term', $this->settings + ['entity' => $one]);
    $with_two = AutocompleteDeluxeElement::autocompletePath('taxonomy_term', 'default:taxonomy_term', $this->settings + ['entity' => $two]);

    $this->assertSame($plain, $with_one, 'Editing an entity gives the same key as no entity at all.');
    $this->assertSame($plain, $with_two, 'A second entity gives that same key too.');
    $this->assertCount(1, \Drupal::keyValue('entity_autocomplete')->getAll(), 'One field keeps one key in the store.');

    $stored = \Drupal::keyValue('entity_autocomplete')->get($this->keyFromPath($with_one));
    $this->assertArrayNotHasKey('entity', $stored, 'The entity was left out of what is stored.');
  }

  /**
   * Different settings give a different key, so an alter takes effect.
   *
   * This is what the issue was about: the settings are hashed after an alter
   * has had its say, rather than before.
   *
   * @covers ::autocompletePath
   */
  public function testAlteredSettingsGiveADifferentKey(): void {
    $before = AutocompleteDeluxeElement::autocompletePath('taxonomy_term', 'default:taxonomy_term', $this->settings);

    $altered = ['match_operator' => 'STARTS_WITH'] + $this->settings;
    $after = AutocompleteDeluxeElement::autocompletePath('taxonomy_term', 'default:taxonomy_term', $altered);

    $this->assertNotSame($before, $after, 'Altering the settings changes the key.');

    $stored = \Drupal::keyValue('entity_autocomplete')->get($this->keyFromPath($after));
    $this->assertSame('STARTS_WITH', $stored['match_operator'], 'The altered settings are the ones that were stored.');
  }

}
