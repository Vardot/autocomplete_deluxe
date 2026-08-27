# cspell:ignore zzzqqqxyz
@autocomplete_deluxe
Feature: The Autocomplete Deluxe widget suggests and selects taxonomy terms
  As a content author
  I want matching terms to be suggested as I type
  So that I can pick the right taxonomy term quickly

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_test"

  Scenario: Typing a matching query shows the suggestion list
    When I type "Alpha" into the autocomplete deluxe field
    Then the autocomplete deluxe suggestion list should appear

  Scenario: Selecting a suggestion adds it as a tag item
    When I type "Beta" into the autocomplete deluxe field
    And the autocomplete deluxe suggestion list should appear
    And I select "Beta" from the autocomplete deluxe suggestions
    Then I should see the autocomplete deluxe tag "Beta"
    And there should be 1 autocomplete deluxe tag

  Scenario: Typing a non-matching query offers no result
    When I type "zzzqqqxyz" into the autocomplete deluxe field
    Then the autocomplete deluxe suggestion list should offer no results
    And there should be 0 autocomplete deluxe tags
