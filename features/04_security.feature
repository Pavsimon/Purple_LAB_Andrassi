Feature: Registration form security
  As a user
  I want my sensitive data to be handled securely
  So that my credentials are never exposed in places they should not appear

  Background:
    Given I am on the registration page

  # ---------------------------------------------------------------------------
  # Password must never be logged to the browser console.
  # Console output is visible to anyone with DevTools open — logging a password
  # is a compliance violation and a real attack surface.
  # Tagged @compliance because this must never be skipped regardless of environment.
  # ---------------------------------------------------------------------------
  @regression @compliance @known-bug
  Scenario: Password value is never exposed in the browser console
    When I enter "TestPass1" in the "Password" field
    Then the password value should not appear in the browser console
