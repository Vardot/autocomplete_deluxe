@autocomplete_deluxe @data-integrity @message-setting
Feature: The Autocomplete Deluxe widget shows the not-found message only when asked
  As a site builder
  I want the row that adds a new value to carry my message only when I turn it on
  So that the widget does not announce something I chose not to say
  (Issue #3534094)

  # field_acd_tags on acd_plain allows new terms with the not-found message
  # turned OFF, so the row that commits a typed value must read as the value
  # itself rather than as the message.

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_plain"

  Scenario: The row offers the value itself, not the message
    When I type "AcdPlainNewTerm" into the autocomplete deluxe field
    Then the autocomplete deluxe suggestion list should appear
    # Without the fix the row reads "The term 'AcdPlainNewTerm' will be added"
    # even though the message is switched off for this field.
    And I should see "AcdPlainNewTerm"
    And I should not see "The term 'AcdPlainNewTerm' will be added"

  Scenario: The value can still be added from that row
    When I type "AcdPlainNewTerm" into the autocomplete deluxe field
    And the autocomplete deluxe suggestion list should appear
    And I commit the autocomplete deluxe input with Enter
    Then I should see the autocomplete deluxe tag "AcdPlainNewTerm"
    And there should be 1 autocomplete deluxe tag

  Scenario: An existing term is unaffected
    When I type "Alpha" into the autocomplete deluxe field
    Then the autocomplete deluxe suggestion list should appear
    When I select "Alpha" from the autocomplete deluxe suggestions
    Then I should see the autocomplete deluxe tag "Alpha"
    And there should be 1 autocomplete deluxe tag
