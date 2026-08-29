@autocomplete_deluxe @selection-handler
Feature: The Autocomplete Deluxe widget suggests through the handler it is told to use
  As a site builder
  I want to name the selection handler on the widget
  So that a field can keep its own handler while the widget suggests through another
  (Issue #3100411)

  # field_acd_tags on acd_sel carries selection_handler_override, which the
  # widget did not have before this issue. Without it the setting is unknown
  # config: the summary has no handler line and the widget settings form has
  # no select to choose one.

  Background:
    Given I am a logged in user with the "Webmaster" user

  Scenario: The widget settings form offers a selection handler
    When I am on "/admin/structure/types/manage/acd_sel/form-display"
    Then I should see "Selection handler: default"

  Scenario: Suggestions still come back through the named handler
    When I am on "/node/add/acd_sel"
    And I type "Alpha" into the autocomplete deluxe field
    Then the autocomplete deluxe suggestion list should appear
    When I select "Alpha" from the autocomplete deluxe suggestions
    Then I should see the autocomplete deluxe tag "Alpha"
    And there should be 1 autocomplete deluxe tag

  Scenario: A value the handler does not know is still offered as new
    When I am on "/node/add/acd_sel"
    And I type "AcdHandlerNewTerm" into the autocomplete deluxe field
    Then the autocomplete deluxe suggestion list should appear
    And I commit the autocomplete deluxe input with Enter
    Then I should see the autocomplete deluxe tag "AcdHandlerNewTerm"
