# Purple LAB — QA Automation Suite

## Project overview

End-to-end test suite for a trading account registration form.
Application under test: `https://my-qbgzo-qacs4.vgabriel.personal.purple-lab.dev/register`

Black-box testing only — no access to source code or backend services.
All tests run against the live staging environment.

---

## Tech stack

| Tool | Version | Purpose |
|---|---|---|
| Playwright | ^1.52 | Browser automation and test runner |
| TypeScript | ^5.8 | Language |
| Faker.js | ^9.7 | Test data generation |

---

## Directory structure

```
features/        Gherkin feature files — written first, specs implement them
tests/           Playwright spec files — one per feature file
pages/           Page Object Model — RegisterPage extends BasePage
fixtures/        Extended test fixture + generateUser() factory
.claude/
  commands/      Custom slash commands (/gherkin, /test_builder)
```

---

## Running tests

```bash
npx playwright test                        # full suite
npx playwright test --workers=4            # explicit parallelism
npx playwright test tests/smoke.spec.ts    # single file
npx playwright test --grep @compliance     # by tag
npx playwright show-report                 # open HTML report
```

npm scripts mirror the above:
```bash
npm test                  # full suite
npm run test:smoke
npm run test:regression
npm run test:compliance
```

---

## How tests are structured

Feature file → spec file → page object. Always in that order.

Each spec maps 1:1 to a feature file. The mapping is declared in a comment at the top of every spec:
```ts
// Maps 1:1 to the Scenario in 02_field_validation.feature
```

Tests never interact with locators directly. All element access goes through `RegisterPage`.

---

## Page Object Model conventions

- `pages/BasePage.ts` — navigation only (`goto(path)`)
- `pages/RegisterPage.ts` — all form interactions
- Locator getters are `get` properties, never methods
- Action methods (`enterFirstName`, `blurFirstName`) are `async`
- Error locators use XPath ancestor + `span:not([data-testid])` pattern:
  ```ts
  this.firstNameInput
    .locator('xpath=ancestor::div[@data-testid][1]')
    .locator('span:not([data-testid])')
  ```
- Locators use `getByLabel` over `getByTestId` where labels exist
  (BUG-023: data-testid values are swapped in the DOM — labels are reliable)

---

## Fixtures

`fixtures/index.ts` exports two things:

**`test`** — extended Playwright test with `registerPage` fixture.
Every test gets a `RegisterPage` already navigated to `/register`.

**`generateUser(workerIndex)`** — parallel-safe test data factory.
`workerIndex` ensures no two parallel workers generate the same email.

Import pattern in every spec:
```ts
import { test, expect } from '../fixtures';
```

---

## Tag taxonomy

| Tag | Meaning | CI behaviour |
|---|---|---|
| `@smoke` | Must pass on every deploy | Blocking |
| `@regression` | Full suite before release | Blocking |
| `@compliance` | Regulatory requirement | Never skip |
| `@known-bug` | Confirmed defect, currently failing | Non-blocking |

---

## Known bugs affecting the suite

| ID | Impact |
|---|---|
| BUG-023 | `data-testid` swapped between firstName/lastName — use `getByLabel` |
| BUG-030 | T&C checkbox unclickable — happy path cannot submit |
| BUG-031 | T&C link in country notice points to wrong URL |
| BUG-032 | Password value logged to browser console on input |

---

## Custom slash commands

| Command | Purpose |
|---|---|
| `/gherkin` | Write and review Gherkin scenarios |
| `/test_builder` | Build a new spec following project conventions |
