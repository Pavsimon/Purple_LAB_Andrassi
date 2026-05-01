import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  // --- Navigation ---
  async goto() {
    await super.goto('/register');
    // domcontentloaded fires when the HTML skeleton arrives — for a React SPA
    // the <div id="root"> is still empty at that point. Waiting for the First
    // name label proves React has hydrated and the form is ready to interact
    // with. Avoids the strict mode violation caused by duplicate data-testid="Button"
    // in the mobile DOM (see README — known mobile bug).
    await this.page.getByLabel('First name').waitFor();
  }

  // ---------------------------------------------------------------------------
  // Locator getters — one per element, defined only when a test needs it.
  // Add a new getter here when you add a new test that needs a new element.
  // NOTE BUG-023: getByLabel('First name') targets the correct visible label,
  // making tests immune to the underlying data-testid swap in the DOM.
  // ---------------------------------------------------------------------------

  // Public — tests assert emptiness and visibility directly on these locators.
  // Write operations always go through the action methods below (enterFirstName
  // etc.) so the fill('') clear step is never forgotten.
  get firstNameInput(): Locator {
    return this.page.getByLabel('First name');
  }

  get lastNameInput(): Locator {
    return this.page.getByLabel('Last name');
  }

  get emailInput(): Locator {
    return this.page.getByLabel('E-mail');
  }

  get passwordInput(): Locator {
    return this.page.getByLabel('Password');
  }

  get countryField(): Locator {
    return this.page.getByTestId('country');
  }

  // ---------------------------------------------------------------------------
  // Initial-state locators — used by smoke tests to assert the form loads
  // correctly before the user interacts with anything.
  // ---------------------------------------------------------------------------

  // The hidden radio input inside the Individual tab — checked = tab is active
  get individualTab(): Locator {
    return this.page.getByTestId('individualTab').locator('input[type="radio"]');
  }

  // The Corporate tab — no data-testid in DOM, targeted by visible text.
  // Note: BUG-007 (16 alert dialogs) is triggered by "Open Demo Corporate Account"
  // button inside the Corporate tab, not by clicking the tab itself.
  get corporateTab(): Locator {
    return this.page.getByText('Corporate', { exact: true });
  }

  // Clickable Individual tab wrapper — used to switch back to Individual.
  // Distinct from individualTab getter which targets the hidden radio input
  // for checked-state assertions only.
  get individualTabLabel(): Locator {
    return this.page.getByTestId('individualTab');
  }

  // The main submit button (data-testid="Button", type="submit").
  // The mobile DOM contains a duplicate data-testid="Button" (type="button") which
  // causes strict mode violations when using getByTestId alone. Filtering by
  // type="submit" targets the real submit button on all viewports.
  get submitButton(): Locator {
    return this.page.locator('[data-testid="Button"][type="submit"]');
  }

  // "I have an affiliate code" checkbox
  get affiliateCheckbox(): Locator {
    return this.page.getByLabel(/I have an affiliate code/i);
  }

  // "I agree with Terms and Conditions" checkbox
  get tcCheckbox(): Locator {
    return this.page.getByLabel(/I agree with Terms and Conditions/i);
  }

  // The notice box that appears below the country field after a valid country
  // is selected (data-testid="Notice" confirmed by DOM inspection)
  get countryNotice(): Locator {
    return this.page.getByTestId('Notice');
  }

  // The "Terms and Conditions" hyperlink scoped to the country notice only
  // (there is a second T&C link in the footer — this targets the correct one)
  get noticeTermsLink(): Locator {
    return this.countryNotice.getByRole('link', { name: 'Terms and Conditions' });
  }

  // ---------------------------------------------------------------------------
  // Public methods — actions and assertions the tests call directly.
  // Tests never interact with locators — they call methods.
  // ---------------------------------------------------------------------------

  // --- Country ---
  async selectCountry(country: string) {
    // React Select: click the wrapper to open the menu, then fill the hidden
    // input (opacity:0) to filter options.
    await this.countryField.click();
    await this.countryField.locator('input').first().fill(country);
    await this.page.getByRole('option', { name: country }).click();
  }

  // --- First name ---
  async enterFirstName(value: string) {
    await this.firstNameInput.fill('');
    await this.firstNameInput.fill(value);
  }

  async blurFirstName() {
    await this.firstNameInput.blur();
  }

  get firstNameError(): Locator {
    // Scope to the nearest ancestor div that owns a data-testid (the field wrapper),
    // then target the error span — the only span without data-testid inside it.
    // Same pattern as passwordError. Robust to DOM depth changes.
    return this.firstNameInput
      .locator('xpath=ancestor::div[@data-testid][1]')
      .locator('span:not([data-testid])');
  }

  // --- Last name ---
  async enterLastName(value: string) {
    await this.lastNameInput.fill('');
    await this.lastNameInput.fill(value);
  }

  async blurLastName() {
    await this.lastNameInput.blur();
  }

  get lastNameError(): Locator {
    return this.lastNameInput
      .locator('xpath=ancestor::div[@data-testid][1]')
      .locator('span:not([data-testid])');
  }

  // --- Email ---
  async enterEmail(value: string) {
    await this.emailInput.fill('');
    await this.emailInput.fill(value);
  }

  async blurEmail() {
    await this.emailInput.blur();
  }

  get emailError(): Locator {
    return this.emailInput
      .locator('xpath=ancestor::div[@data-testid][1]')
      .locator('span:not([data-testid])');
  }

  // --- Password ---
  async enterPassword(value: string) {
    await this.passwordInput.fill('');
    await this.passwordInput.fill(value);
  }

  async blurPassword() {
    await this.passwordInput.blur();
  }

  get passwordError(): Locator {
    // Password field has two Icon spans (show/hide toggle) with data-testid="Icon".
    // The error text span has no data-testid — this selector targets it exclusively.
    return this.page.getByTestId('password').locator('span:not([data-testid])');
  }

  // --- Terms and Conditions ---
  // force: true bypasses Playwright's actionability checks — used to work around
  // BUG-030 where the label intercepts pointer events on the checkbox.
  async acceptTerms({ force = false }: { force?: boolean } = {}) {
    await this.tcCheckbox.check({ force });
  }

  // --- Submit ---
  async clickSubmit() {
    await this.submitButton.click();
  }
}
