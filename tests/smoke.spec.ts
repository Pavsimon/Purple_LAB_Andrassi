import { test, expect } from '../fixtures';

// Maps 1:1 to the Scenario in 00_smoke.feature
test.describe('Registration form — initial state @smoke @regression', () => {

  test('form loads with correct initial state', async ({ registerPage }) => {
    // --- Fields are present and empty ---
    await expect(registerPage.firstNameInput).toBeVisible();
    await expect(registerPage.firstNameInput).toBeEmpty();
    await expect(registerPage.lastNameInput).toBeVisible();
    await expect(registerPage.lastNameInput).toBeEmpty();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.emailInput).toBeEmpty();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeEmpty();
    await expect(registerPage.countryField).toBeVisible();

    // --- Tab selection ---
    await expect(registerPage.individualTab).toBeChecked();

    // --- Checkboxes unchecked ---
    await expect(registerPage.affiliateCheckbox).not.toBeChecked();
    await expect(registerPage.tcCheckbox).not.toBeChecked();

    // --- Submit button disabled with correct label ---
    await expect(registerPage.submitButton).toBeDisabled();
    await expect(registerPage.submitButton).toHaveText('Start trending');
  });

});
