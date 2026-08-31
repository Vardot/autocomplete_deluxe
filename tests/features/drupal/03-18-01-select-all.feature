@autocomplete_deluxe @select-all
Feature: The Autocomplete Deluxe widget can add every suggestion at once
  As a content editor
  I want one row that takes all the suggestions
  So that I do not pick every option one by one
  (Issue #3455998)

  # The acd_all content type has select_all: true on an unlimited field.
  # Every fixture term (Alpha, Beta, Gamma, Delta) contains an "a", so a
  # query of "a" offers four suggestions, while "am" offers only Gamma.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_all"

  Scenario: The row adds every suggestion it stands for
    When I type "a" into the autocomplete deluxe field
    And the autocomplete deluxe suggestion list should appear
    And I select the autocomplete deluxe select all row
    Then there should be 4 autocomplete deluxe tags
    And I should see the autocomplete deluxe tag "Alpha"
    And I should see the autocomplete deluxe tag "Beta"
    And I should see the autocomplete deluxe tag "Gamma"
    And I should see the autocomplete deluxe tag "Delta"

  Scenario: The row is offered when there is more than one suggestion
    When I type "a" into the autocomplete deluxe field
    And the autocomplete deluxe suggestion list should appear
    Then the autocomplete deluxe suggestions should offer a select all row

  Scenario: The row is not offered for a single suggestion
    When I type "am" into the autocomplete deluxe field
    And the autocomplete deluxe suggestion list should appear
    Then the autocomplete deluxe suggestions should not offer a select all row
