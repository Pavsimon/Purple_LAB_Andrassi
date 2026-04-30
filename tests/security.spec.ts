import { test, expect } from '../fixtures';

// Maps 1:1 to the Scenario in 04_security.feature
// Tagged @known-bug — EXPECTED TO FAIL until BUG-032 is fixed.
// The app currently logs the password value to the console on every input event.
// Excluded from CI via --grep-invert @known-bug. Must be re-enabled once fixed.

// The specific password typed during the test.
// We need the concrete value here because the assertion checks console output
// for that exact string — an abstract placeholder would make the test untestable.
const TEST_PASSWORD = 'TestPass1';

test.describe('Registration form security', () => {

  test('password value is never exposed in the browser console @known-bug', async ({ registerPage, page }) => {
    const consoleMessages: string[] = [];

    // Arm the listener BEFORE interacting with the page so no message is missed.
    // We collect all console output (log, warn, error, info, debug) because a
    // password leak can appear in any channel — not just console.log.
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await registerPage.enterPassword(TEST_PASSWORD);

    // Blur triggers validation — also exercises any "on-change" logging paths.
    await registerPage.blurPassword();

    // Fail fast if the password literal appears in any console message.
    const leaked = consoleMessages.filter(msg => msg.includes(TEST_PASSWORD));

    expect(
      leaked,
      `Password was found in browser console output:\n${leaked.join('\n')}`,
    ).toHaveLength(0);
  });

});
