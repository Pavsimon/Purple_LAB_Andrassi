Feature: Registration form field validation
  As a new user
  I want to receive clear feedback when I enter invalid data
  So that I can correct my input before submitting the form

  Background:
    Given I am on the registration page

  # ---------------------------------------------------------------------------
  # FIRST NAME — negative cases (invalid inputs that should trigger an error)
  # ---------------------------------------------------------------------------
  @regression
  Scenario Outline: First name field rejects invalid input
    When I enter "<input>" in the "First name" field
    And I move focus away from the field
    Then the "First name" field should show the error "<expected_error>"

    Examples:
      | input    | expected_error                        | note                        |
      |          | Required                              | empty field                 |
      |          | Required                              | spaces only                 |
      | John123  | Numbers are not allowed in this field | name with digits            |
      | John@Doe | Unsupported characters used           | name with special character |
      | John#Doe | Unsupported characters used           | name with hash character    |

  # ---------------------------------------------------------------------------
  # FIRST NAME — positive cases (valid inputs that should NOT trigger an error)
  # ---------------------------------------------------------------------------
  @regression
  Scenario Outline: First name field accepts valid input
    When I enter "<input>" in the "First name" field
    And I move focus away from the field
    Then the "First name" field should show no error

    Examples:
      | input     | note                          |
      | John      | standard name                 |
      | Mary-Jane | hyphenated name               |
      | María     | accented character            |
      | A         | single character — min length |

  # ---------------------------------------------------------------------------
  # LAST NAME — negative cases
  # Same validation rules as First name
  # ---------------------------------------------------------------------------
  @regression
  Scenario Outline: Last name field rejects invalid input
    When I enter "<input>" in the "Last name" field
    And I move focus away from the field
    Then the "Last name" field should show the error "<expected_error>"

    Examples:
      | input    | expected_error                        | note                        |
      |          | Required                              | empty field                 |
      |          | Required                              | spaces only                 |
      | Doe123   | Numbers are not allowed in this field | name with digits            |
      | Doe@Bar  | Unsupported characters used           | name with special character |

  # ---------------------------------------------------------------------------
  # LAST NAME — positive cases
  # ---------------------------------------------------------------------------
  @regression
  Scenario Outline: Last name field accepts valid input
    When I enter "<input>" in the "Last name" field
    And I move focus away from the field
    Then the "Last name" field should show no error

    Examples:
      | input       | note                          |
      | Doe         | standard name                 |
      | Smith-Jones | hyphenated name               |
      | García      | accented character            |
      | B           | single character — min length |

  # ---------------------------------------------------------------------------
  # EMAIL — negative cases
  # Empty field shows "Required"; all malformed formats show "Invalid email address"
  # ---------------------------------------------------------------------------
  @regression
  Scenario Outline: Email field rejects invalid input
    When I enter "<input>" in the "Email" field
    And I move focus away from the field
    Then the "Email" field should show the error "<expected_error>"

    Examples:
      | input           | expected_error        | note                        |
      |                 | Required              | empty field                 |
      | notanemail      | Invalid email address | missing @ and domain        |
      | missing@        | Invalid email address | missing domain after @      |
      | @nodomain.com   | Invalid email address | missing local part before @ |
      | two@@domain.com | Invalid email address | double @ symbol             |

  # ---------------------------------------------------------------------------
  # EMAIL — positive cases
  # ---------------------------------------------------------------------------
  @regression
  Scenario Outline: Email field accepts valid input
    When I enter "<input>" in the "Email" field
    And I move focus away from the field
    Then the "Email" field should show no error

    Examples:
      | input                  | note                          |
      | john@example.com       | standard email                |
      | john.doe@example.com   | email with dot in local part  |
      | john+tag@example.com   | email with plus tag           |
      | j@example.co.uk        | short local part, two-part TLD|

  # ---------------------------------------------------------------------------
  # PASSWORD — negative cases
  # Error message: "Invalid password format. Please use at least 6 characters
  # and avoid starting or ending with a space."
  # Note: the number requirement is enforced but NOT communicated in the hint
  # — this is a known UX bug (BUG-018)
  # ---------------------------------------------------------------------------
  @regression
  Scenario Outline: Password field rejects invalid input
    When I enter "<input>" in the "Password" field
    And I move focus away from the field
    Then the "Password" field should show an error

    Examples:
      | input    | note                                              |
      |          | empty field                                       |
      | abc1     | too short — 4 characters                          |
      | abcde    | exactly 5 characters — one below minimum          |
      |  Test1   | leading space                                     |
      | Test1    | trailing space                                    |
      | abcdefgh | 8 letters, no number — undisclosed requirement    |

  # ---------------------------------------------------------------------------
  # PASSWORD — positive cases
  # ---------------------------------------------------------------------------
  @regression
  Scenario Outline: Password field accepts valid input
    When I enter "<input>" in the "Password" field
    And I move focus away from the field
    Then the "Password" field should show no error

    Examples:
      | input    | note                                   |
      | abcde1   | exactly 6 characters — minimum         |
      | TestPass1| standard strong password               |
      | Test 1   | space in the middle — should be allowed |
