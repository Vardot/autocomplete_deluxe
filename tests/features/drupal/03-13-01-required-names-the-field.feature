@autocomplete_deluxe @required-error
Feature: A required Autocomplete Deluxe field says which field is missing
  As a content author
  I want the error to name the field I left empty
  So that I know what to fix on a form with several fields
  (Issue #3551660)

  # field_acd_tags on acd_req is required. The element carries no input of its
  # own that the form API can check, so an empty value used to fail later on the
  # entity, where the message reads "This value should not be null."

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_req"

  Scenario: Saving it empty names the field
    When I fill in "Title" with "ACD required empty"
    And I save the form
    Then I should see "ACD Tags field is required"
    And I should not see "This value should not be null"

  Scenario: Saving it with a value succeeds
    When I fill in "Title" with "ACD required filled"
    And I add the autocomplete deluxe tag "Alpha"
    And I save the form
    Then I should see "ACD required filled"
    And I should not see "field is required"
