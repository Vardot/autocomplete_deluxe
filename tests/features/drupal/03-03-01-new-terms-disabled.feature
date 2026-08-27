@autocomplete_deluxe
Feature: The Autocomplete Deluxe widget honours the new-terms setting
  As a site builder
  I want unmatched text to be rejected when new terms are disabled
  So that only existing taxonomy terms can be referenced

  # The test recipe configures the widget with new_terms: false and
  # not_found_message_allow: false. Committing an unmatched value with Enter
  # must therefore add NO chip - a deterministic boundary for the setting.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_test"

  Scenario: Committing an unknown term adds no tag when new terms are disabled
    When I type "BrandNewUnknownTerm" into the autocomplete deluxe field
    And I commit the autocomplete deluxe input with Enter
    Then there should be 0 autocomplete deluxe tags
    And I should not see the autocomplete deluxe tag "BrandNewUnknownTerm"
