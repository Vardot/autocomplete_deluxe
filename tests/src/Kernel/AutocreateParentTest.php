<?php

declare(strict_types=1);

namespace Drupal\Tests\autocomplete_deluxe\Kernel;

use Drupal\autocomplete_deluxe\Element\AutocompleteDeluxeElement;
use Drupal\Core\Form\FormState;
use Drupal\KernelTests\KernelTestBase;
use Drupal\taxonomy\Entity\Term;
use Drupal\taxonomy\Entity\Vocabulary;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that a term the widget creates goes under the parent it was given.
 *
 * The element is driven directly rather than through a browser, because the
 * setting carries a term ID and the browser suite deliberately keeps term IDs
 * out of its fixtures.
 *
 * @coversDefaultClass \Drupal\autocomplete_deluxe\Element\AutocompleteDeluxeElement
 *
 * @group autocomplete_deluxe
 */
#[RunTestsInSeparateProcesses]
class AutocreateParentTest extends KernelTestBase {

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
   * The parent every new term is expected to land under.
   *
   * @var \Drupal\taxonomy\TermInterface
   */
  protected $parent;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->installEntitySchema('taxonomy_term');
    $this->installEntitySchema('user');
    $this->installConfig(['taxonomy']);

    Vocabulary::create(['vid' => 'acd_tags', 'name' => 'ACD Tags'])->save();
    $this->parent = Term::create(['name' => 'Weather', 'vid' => 'acd_tags']);
    $this->parent->save();
  }

  /**
   * Runs the callback over one unsaved term and hands that term back.
   *
   * @param \Drupal\taxonomy\TermInterface $term
   *   The term the callback should see.
   * @param string|int|null $parent
   *   The parent carried by the element, or NULL for none.
   */
  protected function runCallback($term, $parent): void {
    $element = [
      '#parents' => ['field_acd_tags', 'target_id'],
      '#autocreate' => ['bundle' => 'acd_tags'],
    ];
    if ($parent !== NULL) {
      $element['#autocreate']['parent'] = $parent;
    }

    $form_state = new FormState();
    $form_state->setValue(['field_acd_tags', 'target_id'], [['entity' => $term]]);
    $complete_form = [];

    AutocompleteDeluxeElement::setAutocreateParent($element, $form_state, $complete_form);
  }

  /**
   * A new term goes under the parent the widget was given.
   *
   * @covers ::setAutocreateParent
   */
  public function testNewTermGetsTheParent(): void {
    $term = Term::create(['name' => 'Blizzard', 'vid' => 'acd_tags']);
    $this->runCallback($term, $this->parent->id());

    $this->assertSame(
      (int) $this->parent->id(),
      (int) $term->get('parent')->target_id,
      'The new term was put under the configured parent.'
    );
  }

  /**
   * Without the setting the term keeps the top of the vocabulary.
   *
   * @covers ::setAutocreateParent
   */
  public function testNoSettingLeavesTheTermAtTheTop(): void {
    $term = Term::create(['name' => 'Drizzle', 'vid' => 'acd_tags']);
    $this->runCallback($term, NULL);

    $this->assertEmpty(
      (int) $term->get('parent')->target_id,
      'The term was left at the top of the vocabulary.'
    );
  }

  /**
   * A parent that something else already set is kept.
   *
   * @covers ::setAutocreateParent
   */
  public function testAnExistingParentIsKept(): void {
    $other = Term::create(['name' => 'Storms', 'vid' => 'acd_tags']);
    $other->save();

    $term = Term::create(['name' => 'Hailstorm', 'vid' => 'acd_tags']);
    $term->set('parent', ['target_id' => $other->id()]);
    $this->runCallback($term, $this->parent->id());

    $this->assertSame(
      (int) $other->id(),
      (int) $term->get('parent')->target_id,
      'The parent that was already set was kept.'
    );
  }

  /**
   * A term that is already saved is never moved.
   *
   * @covers ::setAutocreateParent
   */
  public function testASavedTermIsNotMoved(): void {
    $term = Term::create(['name' => 'Sunrise', 'vid' => 'acd_tags']);
    $term->save();
    $this->runCallback($term, $this->parent->id());

    $this->assertEmpty(
      (int) $term->get('parent')->target_id,
      'A term that was already saved was left where it was.'
    );
  }

}
