@autocomplete_deluxe @create-access
Feature: The Autocomplete Deluxe widget offers new terms only to a user who may create them
  As a site builder
  I want the widget to follow the create permission of the referenced entity type
  So that an author is never offered a value the save would refuse
  (Issue #3112680)

  # field_acd_tags on acd_free allows new terms and auto-creates them. The
  # Webmaster may create terms in acd_tags; the ACD Tagger role may write the
  # field but has no create-terms permission, so the widget has to stop
  # offering new values to them.

  Scenario: Provision the limited role's user
    Given I am a logged in user with the "Webmaster" user
    When I add the testing users
    Then I am on "/admin/people"
    And I should see "acd_tagger"

  Scenario: A user who may create terms is offered the new value
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_free"
    And I type "AcdBrandNewByAdmin" into the autocomplete deluxe field
    Then the autocomplete deluxe suggestion list should appear
    When I commit the autocomplete deluxe input with Enter
    Then I should see the autocomplete deluxe tag "AcdBrandNewByAdmin"
    And there should be 1 autocomplete deluxe tag

  Scenario: A user who may not create terms is not offered the new value
    Given I am a logged in user with the "Tagger" user
    When I am on "/node/add/acd_free"
    And I type "AcdBrandNewByTagger" into the autocomplete deluxe field
    And I commit the autocomplete deluxe input with Enter
    Then there should be 0 autocomplete deluxe tags
    And I should not see the autocomplete deluxe tag "AcdBrandNewByTagger"

  Scenario: That user can still pick an existing term
    Given I am a logged in user with the "Tagger" user
    When I am on "/node/add/acd_free"
    And I type "Alpha" into the autocomplete deluxe field
    Then the autocomplete deluxe suggestion list should appear
    When I select "Alpha" from the autocomplete deluxe suggestions
    Then I should see the autocomplete deluxe tag "Alpha"
    And there should be 1 autocomplete deluxe tag
