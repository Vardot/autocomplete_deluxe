@autocomplete_deluxe @link-tags
Feature: The Autocomplete Deluxe widget can link a tag to its entity
  As a content editor
  I want to open the term a tag stands for
  So that I can check it without leaving the form
  (Issue #2497675)

  # The acd_link content type has link_tags: true, and allows new terms so the
  # unsaved case can be reached. Only a saved entity carries an ID in its
  # value, so only a saved one has something to link to.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_link"

  Scenario: A tag for a saved term links to that term
    When I add the autocomplete deluxe tag "Alpha"
    Then I should see the autocomplete deluxe tag "Alpha"
    And I should see 1 "a.autocomplete-deluxe-item-link" element
    And the "Alpha" link should contain "/taxonomy/term/"

  Scenario: A term that is not saved yet stays plain text
    When I type "BrandNewUnsavedTerm" into the autocomplete deluxe field
    And the autocomplete deluxe suggestion list should appear
    And I commit the autocomplete deluxe input with Enter
    Then I should see the autocomplete deluxe tag "BrandNewUnsavedTerm"
    And I should see 0 "a.autocomplete-deluxe-item-link" elements
