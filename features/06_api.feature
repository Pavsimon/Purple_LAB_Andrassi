Feature: Trading Account Registration — API Layer
  As the platform
  I want the frontend to correctly communicate with backend services
  So that country eligibility is always validated when the user changes context

  Background:
    Given I am on the registration page
    And I am on the "Individual" tab

  @regression
  Scenario: Country eligibility check re-fires when switching back to Individual tab
    Given I have selected "Christmas Island" as my country of residence
    When I switch to the "Corporate" tab
    And I switch back to the "Individual" tab
    Then the frontend should send a country eligibility check request
    And the request should include country code "CXR" and brand "AXIORY_GLOBAL"
