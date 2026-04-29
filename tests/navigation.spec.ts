import { test, expect } from '../fixtures';

// Maps 1:1 to the Scenario in 06_navigation.feature
// Tagged @known-bug — this test is EXPECTED TO FAIL until BUG-031 is fixed.
// Actual href: https://http.dog/200.jpg  (placeholder image)
// Expected href: https://www.axiory.com/Axiory/media/assets/doc/Tradit_Terms-Conditions.pdf

const CORRECT_TC_URL =
  'https://www.axiory.com/Axiory/media/assets/doc/Tradit_Terms-Conditions.pdf';

test.describe('Navigation links', () => {

  test('Country notice T&C link opens the correct legal document [BUG-031]', async ({ registerPage, page }) => {
    await registerPage.selectCountry('Japan');
    await expect(registerPage.countryNotice).toBeVisible();

    // The link has target="_blank" — arm the new-tab listener BEFORE clicking,
    // otherwise the event fires before waitForEvent() is registered.
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      registerPage.noticeTermsLink.click(),
    ]);

    await newPage.waitForLoadState();

    // Assert the new tab landed on the correct legal document, not a placeholder
    expect(newPage.url()).toBe(CORRECT_TC_URL);
  });

});
