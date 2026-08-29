@autocomplete_deluxe @scrollbar
Feature: The Autocomplete Deluxe suggestion list keeps a visible scrollbar
  As a content author with a long list of options
  I want to see that the list scrolls
  So that I know there is more below and can drag to it without a wheel
  (Issue #3263472)

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_test"

  Scenario: The list shows it can scroll
    When I type "A" into the autocomplete deluxe field
    Then the autocomplete deluxe suggestion list should appear
    And the autocomplete deluxe suggestion list should keep its scrollbar

  Scenario: Suggestions are still selectable
    When I type "Alpha" into the autocomplete deluxe field
    And the autocomplete deluxe suggestion list should appear
    And I select "Alpha" from the autocomplete deluxe suggestions
    Then I should see the autocomplete deluxe tag "Alpha"
