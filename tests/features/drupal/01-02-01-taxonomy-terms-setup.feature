@setup @autocomplete_deluxe
Feature: Provision the acd_tags taxonomy terms
  As the site owner
  I want a known set of taxonomy terms in the acd_tags vocabulary
  So that the Autocomplete Deluxe suggestion scenarios are deterministic

  # The hidden test recipe creates the acd_tags vocabulary with NO terms.
  # This setup feature seeds the four terms every later scenario relies on
  # (Alpha, Beta, Gamma, Delta) through the admin UI, so the suite owns its
  # own test data and never depends on a pre-populated site.

  Background:
    Given I am a logged in user with the "Webmaster" user

  Scenario: Seed the acd_tags vocabulary with the test terms
    When I create the taxonomy term "Alpha" in the "acd_tags" vocabulary
    And I create the taxonomy term "Beta" in the "acd_tags" vocabulary
    And I create the taxonomy term "Gamma" in the "acd_tags" vocabulary
    And I create the taxonomy term "Delta" in the "acd_tags" vocabulary
    Then I am on "/admin/structure/taxonomy/manage/acd_tags/overview"
    And I should see "Alpha"
    And I should see "Beta"
    And I should see "Gamma"
    And I should see "Delta"
