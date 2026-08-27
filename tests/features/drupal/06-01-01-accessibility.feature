@autocomplete_deluxe @a11y
Feature: The Autocomplete Deluxe widget is accessible
  As a content author using assistive technology
  I want the tag widget and its form to meet accessibility expectations
  So that I can tag content regardless of ability

  # The widget-scoped axe audit must pass cleanly. Page-level structural checks
  # are asserted too; full-page axe is intentionally NOT asserted because Gin /
  # Drupal core ships unrelated admin-chrome violations outside this module's
  # control.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_test"

  Scenario: The widget passes a scoped accessibility audit
    Then the element ".field--name-field-acd-tags" should pass an accessibility audit

  Scenario: The content form satisfies key structural accessibility checks
    Then the page should have a title
    And the page should declare a language
    And the page should have exactly one h1
    And the page should have a main landmark
    And user zoom should be allowed

  Scenario: The widget input exposes an accessible name
    Then "input.autocomplete-deluxe-form" should have attribute "aria-label" with value "ACD Tags"
