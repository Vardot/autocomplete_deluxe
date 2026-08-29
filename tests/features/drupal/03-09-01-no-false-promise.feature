@autocomplete_deluxe @data-integrity @no-false-promise
Feature: The Autocomplete Deluxe widget does not promise a term it cannot add
  As a content author
  I want to be told there is no match, not that my typing will be added
  So that I do not wait for a term the field will never create
  (Issue #3226157)

  # field_acd_tags on acd_msg has new terms OFF and the not-found message ON.
  # That is the only configuration where the message could be shown for a value
  # the field is not allowed to create, so it is where the promise has to go.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_msg"

  Scenario: An unmatched value is reported as no result, not as a promise
    When I type "AcdNoSuchTermHere" into the autocomplete deluxe field
    Then the autocomplete deluxe suggestion list should appear
    # Without the guard the row reads "The term '...' will be added", so this
    # phrase is what separates a straight answer from a promise the field
    # cannot keep. The phrase is not asserted as absent, because the widget
    # settings carry the message text in drupalSettings on every page.
    And I should see "No results found"

  Scenario: The unmatched value cannot be committed
    When I type "AcdNoSuchTermHere" into the autocomplete deluxe field
    And the autocomplete deluxe suggestion list should appear
    And I commit the autocomplete deluxe input with Enter
    Then there should be 0 autocomplete deluxe tags

  Scenario: An existing term is still suggested and selectable
    When I type "Alpha" into the autocomplete deluxe field
    Then the autocomplete deluxe suggestion list should appear
    When I select "Alpha" from the autocomplete deluxe suggestions
    Then I should see the autocomplete deluxe tag "Alpha"
    And there should be 1 autocomplete deluxe tag
