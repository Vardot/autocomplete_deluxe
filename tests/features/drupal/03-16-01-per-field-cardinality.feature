@autocomplete_deluxe @cardinality
Feature: The Autocomplete Deluxe widget stops at the number of values a field allows
  As a site builder
  I want the widget to stop accepting values once the field is full
  So that an author is not left with a value the save would drop
  (Issue #3298376)

  # field_acd_tags on acd_card stores at most 2 values, so the widget has a
  # limit to honour without any contrib module involved.
  #
  # The issue is really about a limit set per field rather than per storage,
  # which is what Field Config Cardinality records as a third-party setting.
  # That setting cannot be shipped in this recipe: config carrying it depends on
  # that module, and the test job does not install it. The widget reads the
  # per-field value when it is there and falls back to the storage value when it
  # is not, and it is the fallback these scenarios exercise.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_card"

  Scenario: The field accepts values up to its limit
    When I add the autocomplete deluxe tag "Alpha"
    And I add the autocomplete deluxe tag "Beta"
    Then there should be 2 autocomplete deluxe tags

  Scenario: The field stops at its limit
    When I add the autocomplete deluxe tag "Alpha"
    And I add the autocomplete deluxe tag "Beta"
    And I type "Gamma" into the autocomplete deluxe field
    And I commit the autocomplete deluxe input with Enter
    Then I should see "cannot hold more than 2 values"

  Scenario: A field with no limit is unaffected
    When I am on "/node/add/acd_free"
    And I add the autocomplete deluxe tag "Alpha"
    And I add the autocomplete deluxe tag "Beta"
    And I add the autocomplete deluxe tag "Gamma"
    Then there should be 3 autocomplete deluxe tags
