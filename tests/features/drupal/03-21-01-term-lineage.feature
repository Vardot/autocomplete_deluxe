@autocomplete_deluxe @term-lineage
Feature: A term the Autocomplete Deluxe widget creates can be filed under a parent
  As a site builder
  I want new terms to land under a parent of my choosing
  So that a deep vocabulary does not fill up at its top level
  (Issue #3104486)

  # The acd_lineage content type allows new terms and creates them. The parent
  # is set by name through the widget settings rather than by ID, since the
  # suite keeps term IDs out of its fixtures and the setting resolves a name.

  Background:
    Given I am a logged in user with the "Webmaster" user

  Scenario: Seed the parent the later scenarios file terms under
    Given I create the taxonomy term "AcdParentTerm" in the "acd_tags" vocabulary
    When I am on "/admin/structure/taxonomy/manage/acd_tags/overview"
    Then I should see "AcdParentTerm"

  Scenario: A new term is filed under the chosen parent
    Given the widget on "acd_lineage" files new terms under "AcdParentTerm"
    When I am on "/node/add/acd_lineage"
    And I type "AcdChildTerm" into the autocomplete deluxe field
    And the autocomplete deluxe suggestion list should appear
    And I commit the autocomplete deluxe input with Enter
    Then I should see the autocomplete deluxe tag "AcdChildTerm"
    When I fill in "Title" with "Lineage under a parent"
    And I save the form
    Then the term "AcdChildTerm" should sit under "AcdParentTerm"

  Scenario: A term that already existed is never moved
    Given the widget on "acd_lineage" files new terms under "AcdParentTerm"
    When I am on "/node/add/acd_lineage"
    And I add the autocomplete deluxe tag "Alpha"
    And I fill in "Title" with "Lineage leaves existing terms alone"
    And I save the form
    Then the term "Alpha" should sit at the top

  Scenario: With no parent chosen a new term stays at the top
    Given the widget on "acd_lineage" files new terms at the top
    When I am on "/node/add/acd_lineage"
    And I type "AcdRootTerm" into the autocomplete deluxe field
    And the autocomplete deluxe suggestion list should appear
    And I commit the autocomplete deluxe input with Enter
    Then I should see the autocomplete deluxe tag "AcdRootTerm"
    When I fill in "Title" with "Lineage at the top"
    And I save the form
    Then the term "AcdRootTerm" should sit at the top
