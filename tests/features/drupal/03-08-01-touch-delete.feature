@autocomplete_deluxe @mobile
Feature: The Autocomplete Deluxe widget removes a tag on a touch device
  As a content author on a phone
  I want to tap the delete control and have the tag go away
  So that I can correct a tag without a mouse
  (Issue #3202769)

  # A touch browser does not always send a mouse event for a tap, so the widget
  # listens for touchstart as well, and a coarse pointer gets a bigger tap area
  # behind the small icon.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I set the viewport to the "xs" breakpoint
    And I am on "/node/add/acd_test"

  Scenario: Tapping the delete control removes the tag
    When I add the autocomplete deluxe tag "Alpha"
    And there should be 1 autocomplete deluxe tag
    When I tap the delete control of the autocomplete deluxe tag "Alpha"
    Then I should not see the autocomplete deluxe tag "Alpha"
    And there should be 0 autocomplete deluxe tags

  Scenario: Tapping removes only the tag it belongs to
    When I add the autocomplete deluxe tag "Alpha"
    And I add the autocomplete deluxe tag "Beta"
    And there should be 2 autocomplete deluxe tags
    When I tap the delete control of the autocomplete deluxe tag "Alpha"
    Then I should not see the autocomplete deluxe tag "Alpha"
    And I should see the autocomplete deluxe tag "Beta"
    And there should be 1 autocomplete deluxe tag

  Scenario: The delete control is big enough for a finger
    When I add the autocomplete deluxe tag "Alpha"
    Then the autocomplete deluxe delete control should offer a tap target of at least 24 pixels on a coarse pointer
