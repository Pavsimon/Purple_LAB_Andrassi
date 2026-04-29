import { test as base } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { RegisterPage } from '@pages/RegisterPage';

/**
 * Test data factory.
 * workerIndex ensures no two parallel workers generate the same email.
 */
export function generateUser(workerIndex: number) {
  return {
    firstName: faker.person.firstName().replace(/[^a-zA-Z\-]/g, ''),
    lastName:  faker.person.lastName().replace(/[^a-zA-Z\-]/g, ''),
    email:     `test_w${workerIndex}_${faker.string.uuid()}@mailtest.com`,
    password:  `Test${faker.string.alphanumeric(6)}1`,
    country:   'Japan',
  };
}

/**
 * Extended test fixture.
 * Every test that uses { registerPage } gets a fresh page
 * already navigated to /register.
 */
export const test = base.extend<{
  registerPage: RegisterPage;
}>({
  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await use(registerPage);
  },
});

export { expect } from '@playwright/test';
