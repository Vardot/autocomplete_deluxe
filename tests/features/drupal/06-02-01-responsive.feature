@autocomplete_deluxe @mobile
Feature: The Autocomplete Deluxe widget is usable on small screens
  As a content author on a mobile device
  I want the tag widget to work at a narrow viewport
  So that I can tag content from a phone

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I set the viewport to the "xs" breakpoint
    And I am on "/node/add/acd_test"

  Scenario: The widget renders and accepts a tag at a mobile breakpoint
    Then the "autocomplete deluxe input" element should be visible
    When I add the autocomplete deluxe tag "Alpha"
    Then I should see the autocomplete deluxe tag "Alpha"
    And there should be 1 autocomplete deluxe tag
