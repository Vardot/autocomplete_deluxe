@autocomplete_deluxe @widget-handle
Feature: Other code can reach the Autocomplete Deluxe widget
  As a module developer
  I want the widget object on the input it belongs to
  So that I can add a value from my own JavaScript
  (Issue #3061562)

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_free"

  Scenario: A value added through the handle appears as a tag
    When I add "AcdFromTheHandle" through the autocomplete deluxe widget handle
    Then I should see the autocomplete deluxe tag "AcdFromTheHandle"
    And there should be 1 autocomplete deluxe tag

  Scenario: The handle and the field agree
    When I add "AcdFromTheHandle" through the autocomplete deluxe widget handle
    And I add the autocomplete deluxe tag "Alpha"
    Then I should see the autocomplete deluxe tag "AcdFromTheHandle"
    And I should see the autocomplete deluxe tag "Alpha"
    And there should be 2 autocomplete deluxe tags
