@setup @autocomplete_deluxe
Feature: Provision the Autocomplete Deluxe test site
  As the site owner
  I want the Webmaster signed in
  So that the autocomplete-deluxe widget scenarios have an authenticated admin

  Scenario: The Webmaster signs in
    Given I am a logged in user with the "Webmaster" user
    When I am on "/admin/people"
    Then the "drupal page heading" element should be visible
    And there should be no JavaScript errors
