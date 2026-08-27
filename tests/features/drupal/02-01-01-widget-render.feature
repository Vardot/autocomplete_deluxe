@autocomplete_deluxe
Feature: The Autocomplete Deluxe widget renders on the content form
  As a content author
  I want the tag-style entity-reference widget to render
  So that I can attach taxonomy terms to my content

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_test"

  Scenario: The widget renders inside the ACD Tags field on the content add form
    Then the "acd tags form item" element should be visible
    And the "acd tags label" element should be visible
    And the "autocomplete deluxe widget" element should be visible
    And the "autocomplete deluxe input" element should be visible

  Scenario: The content add form has no JavaScript errors
    Then there should be no JavaScript errors
