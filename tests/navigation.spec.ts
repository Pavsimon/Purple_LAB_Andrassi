import { test, expect } from '../fixtures';

// Maps 1:1 to the Scenario in 05_navigation.feature
// Tagged @known-bug — this test is EXPECTED TO FAIL until BUG-031 is fixed.
// Actual href: https://http.dog/200.jpg  (placeholder image)
// Expected href: https://www.axiory.com/Axiory/media/assets/doc/Tradit_Terms-Conditions.pdf

const CORRECT_TC_URL =
  'https://www.axiory.com/Axiory/media/assets/doc/Tradit_Terms-Conditions.pdf';

test.describe('Navigation links @regression', () => {

  test('Country notice T&C link opens the correct legal document [BUG-031] @known-bug', async ({ registerPage, page }) => {
    await registerPage.selectCountry('Japan');
    await expect(registerPage.countryNotice).toBeVisible();

    // The link has target="_blank" — arm the new-tab listener BEFORE clicking,
    // otherwise the event fires before waitForEvent() is registered.
    // Use Promise.all to avoid a race condition between registering the event listener and clicking the link.
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      registerPage.noticeTermsLink.click(),
    ]);

    await newPage.waitForLoadState();

    expect(newPage.url()).toEqual(CORRECT_TC_URL);
  });

});
