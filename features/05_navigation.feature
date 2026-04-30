Feature: Registration form navigation and tab behaviour
  As a new user
  I want all links and tabs on the registration form to work correctly
  So that I can navigate the form and access the information I need

  Background:
    Given I am on the registration page

  # ---------------------------------------------------------------------------
  # Tab switching
  # ---------------------------------------------------------------------------
  @regression
  Scenario: Switching between Individual and Corporate tabs
    Given I am on the "Individual" tab
    When I click the "Corporate" tab
    Then I should see the Corporate account options
    And I should see the "Open Demo Corporate Account" button
    And I should see the "Open Live Corporate Account" button

  # ---------------------------------------------------------------------------
  # Country-specific T&C link
  # The notice appears after a valid country is selected.
  # Currently fails — BUG-031: link points to http.dog/200.jpg placeholder.
  # ---------------------------------------------------------------------------
  @regression @known-bug
  Scenario: Country notice Terms and Conditions link points to the correct legal document
    When I select "Japan" as the country of residence
    Then a notice should appear below the country field
    And the "Terms and Conditions" link in the notice should point to "https://www.axiory.com/Axiory/media/assets/doc/Tradit_Terms-Conditions.pdf"
