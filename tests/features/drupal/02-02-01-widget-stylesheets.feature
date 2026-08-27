@autocomplete_deluxe
Feature: The Autocomplete Deluxe widget attaches the admin-theme stylesheet
  As a content author on a Drupal admin theme
  I want the widget to load the correct stylesheet for my admin theme
  So that the tag-style field is styled consistently
  (Issue #3591908)

  # src/Element/AutocompleteDeluxeElement.php attaches:
  #   - autocomplete_deluxe.claro.css ALWAYS (Claro, Gin, Default Admin).
  #   - autocomplete_deluxe.gin.css ONLY under Gin (D11) / Default Admin (D12).
  # The CI matrix runs the @gin scenario only on Gin / Default Admin and the
  # claro cell adds "and not @gin".

  Background:
    Given I am a logged in user with the "Webmaster" user
    When I am on "/node/add/acd_test"

  @claro
  Scenario: The Claro stylesheet library is attached on every admin theme
    Then the "autocomplete deluxe claro stylesheet" element should exist

  @gin
  Scenario: The Gin stylesheet library is attached under Gin and Default Admin
    Then the "autocomplete deluxe gin stylesheet" element should exist
