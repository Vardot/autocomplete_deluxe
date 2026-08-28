@autocomplete_deluxe @data-integrity
Feature: The Autocomplete Deluxe widget refuses duplicate values
  As a content author
  I want a term I already picked to stay a single tag
  So that the saved reference list never repeats the same term
  (Issue #2903340)

  # field_acd_tags on acd_free is configured with new_terms: true, so a typed
  # value is committed on Enter. A value already held by the widget - picked
  # from the suggestions or typed before - must be rejected either way.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_free"

  Scenario: Retyping a picked term leaves a single tag
    When I add the autocomplete deluxe tag "Alpha"
    And there should be 1 autocomplete deluxe tag
    When I type "Alpha" into the autocomplete deluxe field
    And I commit the autocomplete deluxe input with Enter
    Then I should see the autocomplete deluxe tag "Alpha"
    And there should be 1 autocomplete deluxe tag

  Scenario: Retyping a typed new term leaves a single tag
    When I type "AcdBrandNewTerm" into the autocomplete deluxe field
    And I commit the autocomplete deluxe input with Enter
    And I should see the autocomplete deluxe tag "AcdBrandNewTerm"
    When I type "AcdBrandNewTerm" into the autocomplete deluxe field
    And I commit the autocomplete deluxe input with Enter
    Then there should be 1 autocomplete deluxe tag

  Scenario: A different term is still accepted alongside the first
    When I add the autocomplete deluxe tag "Alpha"
    And I type "Alpha" into the autocomplete deluxe field
    And I commit the autocomplete deluxe input with Enter
    And I add the autocomplete deluxe tag "Beta"
    Then I should see the autocomplete deluxe tag "Alpha"
    And I should see the autocomplete deluxe tag "Beta"
    And there should be 2 autocomplete deluxe tags
