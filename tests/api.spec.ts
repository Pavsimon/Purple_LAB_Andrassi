import { test, expect } from '../fixtures';

// Maps 1:1 to the Scenario in 06_api.feature
// Network-level test — asserts the frontend re-triggers the country eligibility
// check on every tab switch back to Individual, not just on page load.
// Does not require form submission — not blocked by BUG-030.

test.describe('API layer — network requests @regression', () => {

  test('country check re-fires when switching back to Individual tab', async ({ registerPage, page }) => {
    // Select a known country first so the countryCode in the request is deterministic.
    // Using Christmas Island (CXR) — avoids any IP geolocation default.
    const testCountry = { name: 'Christmas Island', code: 'CXR' };
    await registerPage.selectCountry(testCountry.name);

    // Switch to Corporate tab — the tab switch itself is clean.
    // BUG-007 (16 alert dialogs) is triggered by "Open Demo Corporate Account",
    // not by the tab click, so no dialog handling needed here.
    await registerPage.corporateTab.click();

    // Switching back to Individual re-triggers the country eligibility check.
    // Click the visible label, not the hidden radio input used for assertions.
    const [request] = await Promise.all([
      page.waitForRequest(req =>
        req.url().includes('/checkCountry') &&
        req.url().includes(`countryCode=${testCountry.code}`) &&
        req.url().includes('brand=AXIORY_GLOBAL')
      ),
      registerPage.individualTabLabel.click(),
    ]);

    expect(request.url()).toContain('checkCountry');
    expect(request.url()).toContain(`countryCode=${testCountry.code}`);
    expect(request.url()).toContain('brand=AXIORY_GLOBAL');
  });

});
