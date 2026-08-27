@autocomplete_deluxe
Feature: The module help page renders the README via hook_help
  As a site administrator
  I want the module help page to render
  So that I can read the module documentation in the admin UI

  # hook_help works procedurally on D10 and via the OOP #[Hook] class on
  # D11.1+/D12; both render the README at /admin/help/autocomplete_deluxe.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/admin/help/autocomplete_deluxe"

  Scenario: The help page renders the README
    Then the "drupal page heading" element should be visible
    And I should see "Autocomplete Deluxe"
    And I should see "enhanced autocomplete"

  Scenario: The help page has no JavaScript errors
    Then there should be no JavaScript errors
