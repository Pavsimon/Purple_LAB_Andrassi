# =============================================================================
# Compliance scenarios are the most important to have in plain English.
# A compliance officer or legal reviewer can read these and confirm
# they match the AML-CFT Policy and EU/EEA restrictions
# without needing to understand any code.
# =============================================================================

Feature: Trading Account Registration — Compliance & Country Restrictions
  As the platform
  I want to block registrations from restricted countries
  So that we comply with EU/EEA regulations and AML-CFT policy

  Background:
    Given I am on the registration page
    And I am on the "Individual" tab

  # ---------------------------------------------------------------------------
  # EU / EEA COUNTRIES — should be blocked at country selection or submission
  # ---------------------------------------------------------------------------
  @compliance @regression
  Scenario Outline: EU/EEA country triggers a restriction warning
    When I select "<country>" as the country of residence
    Then I should see a message that my country is not eligible to register

    Examples:
      | country        |
      | Germany        |
      | France         |
      | Netherlands    |
      | Sweden         |
      | Italy          |
      | Spain          |

  # ---------------------------------------------------------------------------
  # FATF BLACKLISTED COUNTRIES — should be blocked (Iran, North Korea, Myanmar)
  # @known-bug — BUG-022: Iran currently appears in dropdown without restriction
  # ---------------------------------------------------------------------------
  @compliance @regression @known-bug
  Scenario Outline: FATF blacklisted country is blocked from registration
    When I select "<country>" as the country of residence
    Then I should not be able to proceed with registration
    And I should see a message explaining why registration is not available

    Examples:
      | country      |
      | Iran         |
      | North Korea  |
      | Myanmar      |

  # ---------------------------------------------------------------------------
  # SWITZERLAND — triggers a special consent modal before proceeding
  # @known-bug — BUG-016: modal has no close button, creates infinite loop
  # ---------------------------------------------------------------------------
  @compliance @regression @known-bug
  Scenario: Switzerland selection triggers a consent modal
    When I select "Switzerland" as the country of residence
    Then a consent modal should appear
    And the modal should contain a warning about Swiss regulations
    And the modal should have an "I agree" button
    And the modal should have a "I disagree" button

  @compliance @regression @known-bug
  Scenario: Agreeing to the Switzerland consent modal allows the user to continue
    When I select "Switzerland" as the country of residence
    And the consent modal appears
    And I click "I agree" in the modal
    Then the modal should close
    And I should be able to continue filling the form

  @compliance @regression @known-bug
  Scenario: Disagreeing with the Switzerland consent modal blocks registration
    When I select "Switzerland" as the country of residence
    And the consent modal appears
    And I click "I disagree" in the modal
    Then I should not be able to proceed with registration

  # ---------------------------------------------------------------------------
  # VALID NON-RESTRICTED COUNTRY — registration should be allowed
  # ---------------------------------------------------------------------------
  @compliance @smoke
  Scenario Outline: Non-restricted country allows registration to proceed
    When I select "<country>" as the country of residence
    Then no restriction warning should appear
    And the form should remain available for completion

    Examples:
      | country   |
      | Japan     |
      | Canada    |
      | Australia |
