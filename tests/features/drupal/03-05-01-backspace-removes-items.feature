@autocomplete_deluxe @keyboard
Feature: The Autocomplete Deluxe widget removes tags with Backspace
  As a keyboard-only content author
  I want Backspace on an empty input to mark and then remove the last tag
  So that I can drop a wrong tag without reaching for the mouse
  (Issue #3517136)

  # Backspace on an empty input is a two-stage confirmation: the first press
  # marks the last tag, the second removes it. Marking is carried by the
  # `autocomplete-deluxe-item-focus` class on that tag.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_test"

  Scenario: The first Backspace marks the last tag without removing it
    When I add the autocomplete deluxe tag "Alpha"
    And I add the autocomplete deluxe tag "Beta"
    And I press Backspace in the autocomplete deluxe field
    Then the autocomplete deluxe tag "Beta" should be marked for removal
    And I should see the autocomplete deluxe tag "Beta"
    And there should be 2 autocomplete deluxe tags

  Scenario: A second Backspace removes the marked tag and keeps the rest
    When I add the autocomplete deluxe tag "Alpha"
    And I add the autocomplete deluxe tag "Beta"
    And I press Backspace in the autocomplete deluxe field
    And I press Backspace in the autocomplete deluxe field
    Then I should not see the autocomplete deluxe tag "Beta"
    And I should see the autocomplete deluxe tag "Alpha"
    And there should be 1 autocomplete deluxe tag

  Scenario: Typing after the first Backspace clears the marking
    When I add the autocomplete deluxe tag "Gamma"
    And I press Backspace in the autocomplete deluxe field
    And the autocomplete deluxe tag "Gamma" should be marked for removal
    And I type "Delta" into the autocomplete deluxe field
    Then the autocomplete deluxe tag "Gamma" should not be marked for removal
    And I should see the autocomplete deluxe tag "Gamma"
