@autocomplete_deluxe @entity-id
Feature: The Autocomplete Deluxe widget can keep the entity ID beside the label
  As a content author working with entities that share a name
  I want the ID kept on the suggestion and on the tag
  So that I can tell two entities with the same name apart
  (Issue #3181219)

  # field_acd_tags on acd_ids has the new "Show the entity ID" setting on.
  # Without it the widget strips the trailing "(id)" from both the suggestion
  # and the chip, which is exactly what makes same-named terms ambiguous.

  Background:
    Given I am a logged in user with the "Webmaster" user

  Scenario: The widget summary reports the setting
    When I am on "/admin/structure/types/manage/acd_ids/form-display"
    Then I should see "Show the entity ID: Yes"

  Scenario: The suggestion keeps the ID when the setting is on
    When I am on "/node/add/acd_ids"
    And I type "Alpha" into the autocomplete deluxe field
    Then the autocomplete deluxe suggestion list should appear
    And I should see "Alpha ("

  Scenario: The tag keeps the ID when the setting is on
    When I am on "/node/add/acd_ids"
    And I type "Alpha" into the autocomplete deluxe field
    And the autocomplete deluxe suggestion list should appear
    And I press the down arrow in the autocomplete deluxe field
    And I commit the autocomplete deluxe input with Enter
    Then there should be 1 autocomplete deluxe tag
    # The chip keeps the "(id)" the widget strips when the setting is off.
    And I should see "Alpha ("

  Scenario: A field without the setting still shows the plain label
    When I am on "/node/add/acd_test"
    And I add the autocomplete deluxe tag "Alpha"
    Then I should see the autocomplete deluxe tag "Alpha"
    And there should be 1 autocomplete deluxe tag
