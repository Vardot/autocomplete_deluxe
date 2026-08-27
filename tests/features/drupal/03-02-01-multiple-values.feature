@autocomplete_deluxe
Feature: The Autocomplete Deluxe widget manages multiple tag values
  As a content author
  I want to add and remove several taxonomy terms
  So that I can tag content with more than one term

  # field_acd_tags has unlimited cardinality (-1), so the widget accepts many
  # values, each rendered as its own removable chip.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_test"

  Scenario: Adding two terms produces two tag items
    When I add the autocomplete deluxe tag "Alpha"
    And I add the autocomplete deluxe tag "Gamma"
    Then I should see the autocomplete deluxe tag "Alpha"
    And I should see the autocomplete deluxe tag "Gamma"
    And there should be 2 autocomplete deluxe tags

  Scenario: Removing a tag deletes only that item
    When I add the autocomplete deluxe tag "Alpha"
    And I add the autocomplete deluxe tag "Beta"
    And there should be 2 autocomplete deluxe tags
    When I remove the autocomplete deluxe tag "Alpha"
    Then I should not see the autocomplete deluxe tag "Alpha"
    And I should see the autocomplete deluxe tag "Beta"
    And there should be 1 autocomplete deluxe tag
