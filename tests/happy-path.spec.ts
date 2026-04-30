import { test, expect } from '../fixtures';
import { generateUser } from '../fixtures';

// Maps 1:1 to the Scenario in 01_registration_happy_path.feature
// Tagged @known-bug in the feature file — BUG-030 currently blocks submission.
// This test is EXPECTED TO FAIL until BUG-030 is fixed

test.describe('Registration — happy path @regression', () => {

  test('successful registration with valid data from a non-restricted country @known-bug', async ({ registerPage, page }, testInfo) => {
    const user = generateUser(testInfo.workerIndex);

    await registerPage.enterFirstName(user.firstName);
    await registerPage.enterLastName(user.lastName);
    await registerPage.enterEmail(user.email);
    await registerPage.enterPassword(user.password);
    await registerPage.selectCountry(user.country);
    await registerPage.acceptTerms();

    // Arm the response listener BEFORE clicking submit — if the click fires first
    // the response could arrive before waitForResponse is registered (race condition).
    // Promise.all starts both simultaneously, so nothing is missed.
    const [response] = await Promise.all([
      page.waitForResponse(res => res.request().method() === 'POST'),
      registerPage.clickSubmit(),
    ]);

    // response.ok() returns true for any 2xx status — browser Response equivalent
    // of toBeOK() which only works with the APIResponse type from request fixture.
    // Exact status TBD once BUG-030 is fixed and we can observe a real submission.
    expect(response.ok()).toBe(true);
    // TODO: assert post-registration UI state once BUG-030 is resolved.
    // Expected: redirect to /dashboard or a "check your email" confirmation screen.
    // Tracked in: BUG-030
  });

});
