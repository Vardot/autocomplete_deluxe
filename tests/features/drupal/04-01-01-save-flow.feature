@autocomplete_deluxe
Feature: Saving content persists the Autocomplete Deluxe selections
  As a content author
  I want my chosen tags saved with the content
  So that the entity-reference values are stored correctly

  # The acd_test content type hides field_acd_tags on its view display, so the
  # saved value is verified by re-opening the edit form, where the chip must
  # reappear from the stored reference.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_test"

  Scenario: A saved tag reappears when the content is edited again
    When I fill in "Title" with "ACD save flow node"
    And I add the autocomplete deluxe tag "Gamma"
    And I should see the autocomplete deluxe tag "Gamma"
    And I save the form
    Then I should see "ACD save flow node"
    When I open the edit form of the current node
    Then I should see the autocomplete deluxe tag "Gamma"
    And there should be 1 autocomplete deluxe tag
