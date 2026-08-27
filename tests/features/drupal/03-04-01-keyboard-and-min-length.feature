@autocomplete_deluxe
Feature: The Autocomplete Deluxe widget supports keyboard selection
  As a keyboard-only content author
  I want to navigate and choose suggestions without a mouse
  So that the widget is usable from the keyboard

  # The test recipe sets min_length: 0, so the suggestion menu opens from the
  # first typed character.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_test"

  Scenario: A single character opens the suggestion list (min length 0)
    When I type "A" into the autocomplete deluxe field
    Then the autocomplete deluxe suggestion list should appear

  Scenario: Arrow-down then Enter selects a highlighted suggestion
    When I type "Delta" into the autocomplete deluxe field
    And the autocomplete deluxe suggestion list should appear
    And I press the down arrow in the autocomplete deluxe field
    And I commit the autocomplete deluxe input with Enter
    Then I should see the autocomplete deluxe tag "Delta"
    And there should be 1 autocomplete deluxe tag
