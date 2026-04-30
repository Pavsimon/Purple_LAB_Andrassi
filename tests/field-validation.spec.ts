import { test, expect } from '../fixtures';

// Maps 1:1 to the Scenario Outlines in 02_field_validation.feature
// Each entry = one row in the Examples table

// Error message constants — extracted so a wording change in the app requires
// updating one line here rather than hunting through every test array.
const PASSWORD_ERROR = 'Invalid password format. Please use at least 6 characters and avoid starting or ending with a space.';
const REQUIRED_ERROR = 'Required';
const INVALID_EMAIL_ERROR = 'Invalid email address';
const UNSUPPORTED_CHAR_ERROR = 'Unsupported characters used';
const NUMBERS_NOT_ALLOWED_ERROR = 'Numbers are not allowed in this field';

const INVALID_FIRST_NAME_INPUTS = [
  { input: '',         expectedError: REQUIRED_ERROR,                              note: 'empty field'              },
  { input: '   ',      expectedError: REQUIRED_ERROR,                              note: 'spaces only'              },
  { input: 'John123',  expectedError: NUMBERS_NOT_ALLOWED_ERROR,                   note: 'name with digits'         },
  { input: 'John@Doe', expectedError: UNSUPPORTED_CHAR_ERROR,                      note: 'name with special char'   },
  { input: 'John#Doe', expectedError: UNSUPPORTED_CHAR_ERROR,                      note: 'name with hash character' },
] as const;

const VALID_FIRST_NAME_INPUTS = [
  { input: 'John',      note: 'standard name'            },
  { input: 'Mary-Jane', note: 'hyphenated name'          },
  { input: 'María',     note: 'accented character'        },
  { input: 'A',         note: 'single character'         },
] as const;

const INVALID_LAST_NAME_INPUTS = [
  { input: '',        expectedError: REQUIRED_ERROR,                              note: 'empty field'              },
  { input: '   ',     expectedError: REQUIRED_ERROR,                              note: 'spaces only'              },
  { input: 'Doe123',  expectedError: NUMBERS_NOT_ALLOWED_ERROR,                   note: 'name with digits'         },
  { input: 'Doe@Bar', expectedError: UNSUPPORTED_CHAR_ERROR,                      note: 'name with special char'   },
] as const;

const VALID_LAST_NAME_INPUTS = [
  { input: 'Doe',         note: 'standard name'            },
  { input: 'Smith-Jones', note: 'hyphenated name'          },
  { input: 'García',      note: 'accented character'       },
  { input: 'B',           note: 'single character'         },
] as const;

const INVALID_EMAIL_INPUTS = [
  { input: '',              expectedError: REQUIRED_ERROR,         note: 'empty field'                 },
  { input: 'notanemail',    expectedError: INVALID_EMAIL_ERROR,    note: 'missing @ and domain'        },
  { input: 'missing@',      expectedError: INVALID_EMAIL_ERROR,    note: 'missing domain after @'      },
  { input: '@nodomain.com', expectedError: INVALID_EMAIL_ERROR,    note: 'missing local part before @' },
  { input: 'two@@dom.com',  expectedError: INVALID_EMAIL_ERROR,    note: 'double @ symbol'             },
] as const;

const VALID_EMAIL_INPUTS = [
  { input: 'john@example.com',      note: 'standard email'                 },
  { input: 'john.doe@example.com',  note: 'email with dot in local part'   },
  { input: 'john+tag@example.com',  note: 'email with plus tag'            },
  { input: 'j@example.co.uk',       note: 'short local part, two-part TLD' },
] as const;

test.describe('First name field validation @regression', () => {

  test.describe('invalid inputs', () => {
    for (const { input, expectedError, note } of INVALID_FIRST_NAME_INPUTS) {
      test(`rejects: ${note}`, async ({ registerPage }) => {
        await registerPage.enterFirstName(input);
        await registerPage.blurFirstName();

        await expect(registerPage.firstNameError).toHaveText(expectedError);
      });
    }
  });

  test.describe('valid inputs', () => {
    for (const { input, note } of VALID_FIRST_NAME_INPUTS) {
      test(`accepts: ${note}`, async ({ registerPage }) => {
        await registerPage.enterFirstName(input);
        await registerPage.blurFirstName();

        await expect(registerPage.firstNameError).not.toBeVisible();
      });
    }
  });

});

test.describe('Last name field validation @regression', () => {

  test.describe('invalid inputs', () => {
    for (const { input, expectedError, note } of INVALID_LAST_NAME_INPUTS) {
      test(`rejects: ${note}`, async ({ registerPage }) => {
        await registerPage.enterLastName(input);
        await registerPage.blurLastName();

        await expect(registerPage.lastNameError).toHaveText(expectedError);
      });
    }
  });

  test.describe('valid inputs', () => {
    for (const { input, note } of VALID_LAST_NAME_INPUTS) {
      test(`accepts: ${note}`, async ({ registerPage }) => {
        await registerPage.enterLastName(input);
        await registerPage.blurLastName();

        await expect(registerPage.lastNameError).not.toBeVisible();
      });
    }
  });

});

test.describe('Email field validation @regression', () => {

  test.describe('invalid inputs', () => {
    for (const { input, expectedError, note } of INVALID_EMAIL_INPUTS) {
      test(`rejects: ${note}`, async ({ registerPage }) => {
        await registerPage.enterEmail(input);
        await registerPage.blurEmail();

        await expect(registerPage.emailError).toHaveText(expectedError);
      });
    }
  });

  test.describe('valid inputs', () => {
    for (const { input, note } of VALID_EMAIL_INPUTS) {
      test(`accepts: ${note}`, async ({ registerPage }) => {
        await registerPage.enterEmail(input);
        await registerPage.blurEmail();

        await expect(registerPage.emailError).not.toBeVisible();
      });
    }
  });

});

const INVALID_PASSWORD_INPUTS = [
  { input: '',       expectedError: PASSWORD_ERROR, note: 'empty field'                        },
  { input: 'abc1',   expectedError: PASSWORD_ERROR, note: 'too short — 4 characters'           },
  { input: 'abcde',  expectedError: PASSWORD_ERROR, note: 'exactly 5 characters — one below minimum' },
  { input: ' Test1', expectedError: PASSWORD_ERROR, note: 'leading space'                      },
  { input: 'Test1 ', expectedError: PASSWORD_ERROR, note: 'trailing space'                     },
  // 'abcdefgh' (no number) excluded — number requirement is not validated on blur,
  // only at submit time. This is BUG-018 (undisclosed requirement).
] as const;

const VALID_PASSWORD_INPUTS = [
  { input: 'abcde1',    note: 'exactly 6 characters — minimum'    },
  { input: 'TestPass1', note: 'standard strong password'           },
  { input: 'Test 1',    note: 'space in the middle — allowed'      },
] as const;

test.describe('Password field validation @regression', () => {

  test.describe('invalid inputs', () => {
    for (const { input, expectedError, note } of INVALID_PASSWORD_INPUTS) {
      test(`rejects: ${note}`, async ({ registerPage }) => {
        await registerPage.enterPassword(input);
        await registerPage.blurPassword();

        await expect(registerPage.passwordError).toHaveText(expectedError);
      });
    }
  });

  test.describe('valid inputs', () => {
    for (const { input, note } of VALID_PASSWORD_INPUTS) {
      test(`accepts: ${note}`, async ({ registerPage }) => {
        await registerPage.enterPassword(input);
        await registerPage.blurPassword();

        await expect(registerPage.passwordError).not.toBeVisible();
      });
    }
  });

});
