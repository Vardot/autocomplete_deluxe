@autocomplete_deluxe @keyboard @needs-3447536
# Tagged @needs-3447536 because these scenarios cover the Enter guard added in
# https://www.drupal.org/node/3447536. Until that fix lands on the target branch
# the key press still reaches the form's submit handler, so the pipeline
# excludes this tag. Once it lands, drop the tag here and its exclusion from
# .gitlab-ci.yml.
Feature: The Autocomplete Deluxe widget keeps Enter inside the field
  As a content author
  I want Enter on an unmatched term to stay in the widget
  So that a typo never saves the content behind my back
  (Issue #3447536)

  # field_acd_tags on acd_test is configured with new_terms: false, so an
  # unmatched value is discarded: the input is cleared, no tag is added, and the
  # key press must not reach the node form's submit handler.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_test"

  Scenario: Enter on an unmatched term does not submit the node form
    When I fill in "Title" with "ACD enter guard node"
    And I type "BrandNewUnknownTerm" into the autocomplete deluxe field
    And I commit the autocomplete deluxe input with Enter
    Then I should be on "/node/add/acd_test"
    And the "autocomplete deluxe input" element should be visible
    And I should not see "has been created"

  Scenario: Enter on an unmatched term clears the input and adds no tag
    When I type "BrandNewUnknownTerm" into the autocomplete deluxe field
    And I commit the autocomplete deluxe input with Enter
    Then the autocomplete deluxe field should be empty
    And there should be 0 autocomplete deluxe tags

  Scenario: The node is only created once the author saves the form
    When I fill in "Title" with "ACD enter guard saved node"
    And I type "BrandNewUnknownTerm" into the autocomplete deluxe field
    And I commit the autocomplete deluxe input with Enter
    And I should be on "/node/add/acd_test"
    When I save the form
    Then I should see "ACD enter guard saved node"
