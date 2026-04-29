Feature: Registration form — smoke checks
  As a QA engineer
  I want to verify the registration form loads correctly
  So that I can confirm the app is ready for further testing

  Background:
    Given I am on the registration page

  # ---------------------------------------------------------------------------
  # Sanity check that the form starts clean before the user touches anything.
  # NOTE: submit button currently reads "Start trending" instead of "Start trading"
  # — label assertion documents the typo (BUG-032) until it is fixed.
  # ---------------------------------------------------------------------------
  @smoke
  Scenario: Registration form loads with correct initial state
    Then the "Individual" tab should be selected by default
    And the "First name" field should be visible and empty
    And the "Last name" field should be visible and empty
    And the "Email" field should be visible and empty
    And the "Password" field should be visible and empty
    And the "Country of Residence" field should be visible
    And the "I have an affiliate code" checkbox should be unchecked
    And the "I agree with Terms and Conditions" checkbox should be unchecked
    And the submit button should be disabled
    And the submit button should display "Start trading"
