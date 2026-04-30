# Purple LAB — QA Automation Suite

End-to-end test suite for a trading account registration form built with Playwright and TypeScript.

**Application under test:**
`https://my-qbgzo-qacs4.vgabriel.personal.purple-lab.dev/register`

---

## What this suite covers

| Feature | Spec | Description |
|---|---|---|
| Initial state | `smoke.spec.ts` | Form loads with correct default values and field states |
| Happy path | `happy-path.spec.ts` | Successful registration with valid data |
| Field validation | `field-validation.spec.ts` | Invalid and valid inputs for all form fields |
| Security | `security.spec.ts` | Password value never exposed in browser console |
| Navigation | `navigation.spec.ts` | Links resolve to correct URLs |

Each spec maps 1:1 to a Gherkin feature file in `features/`.

Compliance testing (EU/EEA blocking, FATF blacklist, country notices) is covered in `TEST_REPORT.md` and by the compliance specialist agent in the agentic pipeline. A static spec was not written — most compliance scenarios are currently blocked by known bugs, making a passing spec misleading and a failing one redundant given the detailed bug report already in place.

---

## Tech stack

| Tool | Version |
|---|---|
| [Playwright](https://playwright.dev) | 1.52 |
| TypeScript | 5.8 |
| Node.js | 23 |
| Faker.js | 9.7 |

---

## Getting started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

**Environment:** tests run against the staging URL by default.
To override, set `BASE_URL` in your shell before running:

```bash
export BASE_URL=https://your-environment-url-here
```

A `.env.example` is provided as a template.

---

## Running tests

```bash
# Full suite
npm test

# CI — excludes @known-bug tests, expects 0 failures
npm run test:ci

# By tag
npm run test:smoke        # critical path only
npm run test:regression   # full regression suite before release

# Headed mode (watch the browser) 
npm run test:headed

# Explicit worker count
npx playwright test --workers=4

# Single file
npx playwright test tests/field-validation.spec.ts

# Open HTML report after a run
npm run test:report
```

---

## CI

The suite runs automatically on every push and pull request via GitHub Actions (`.github/workflows/ci.yml`).

The CI script is `npm run test:ci`, which runs the full suite excluding tests tagged `@known-bug` in their title. This keeps the pipeline green while known defects are tracked and documented — failing tests are not hidden, they are excluded intentionally and listed in the Known failing tests section below.

The HTML report is uploaded as a GitHub Actions artifact after every run (pass or fail) and kept for 7 days.

---

## Project structure

```
features/          Gherkin feature files — written before the specs
tests/             Playwright spec files
pages/
  BasePage.ts      Navigation base class
  RegisterPage.ts  All form interactions and locators
fixtures/
  index.ts         Extended test fixture + generateUser() factory
agents/
  context.md       Shared config for all agents (URL, schema, severity definitions)
  security.md      Security agent prompt
  functional.md    Functional agent prompt
  compliance.md    Compliance agent prompt
  ux.md            UX & content agent prompt
  responsive.md    Responsive design agent prompt
  report-writer.md Report writer agent prompt
  results/         Agent JSON outputs and dated bug hunt reports (gitignored)
playwright.config.ts
tsconfig.json
```

---

## Architecture decisions

### BDD-first
Feature files in `features/` are written before the specs. Each spec references its feature file in a comment at the top. The Gherkin is the source of truth for what is being tested and why.

### Page Object Model
Tests never interact with locators directly. All element access goes through `RegisterPage`. Locator getters are `get` properties, action methods are `async` functions. The boundary is intentional — tests read as behaviour, the page object handles DOM knowledge.

### Parallel-safe test data
`generateUser(testInfo.workerIndex)` generates unique emails per parallel worker to prevent backend collisions. The suite runs with `fullyParallel: true`.

### Fixture-driven setup
Every test receives a `registerPage` already navigated to `/register` via the extended fixture in `fixtures/index.ts`. No test sets up its own page or navigation.

---

## Tag taxonomy

| Tag | Meaning |
|---|---|
| `@smoke` | Must pass on every deploy |
| `@regression` | Full suite, run before every release |
| `@compliance` | Regulatory requirement — never skip |
| `@known-bug` | Test is correct, app is currently broken |

---

## Known failing tests

The following tests are expected to fail due to confirmed defects. They are tagged `@known-bug` and are non-blocking in CI.

| Test | Bug | Description |
|---|---|---|
| `happy-path` | BUG-030 | T&C checkbox intercepts pointer events — form cannot be submitted |
| `navigation` | BUG-031 | Country notice T&C link resolves to a placeholder image, not the legal document |
| `security` | BUG-032 | Password value is logged to the browser console 3 times per input event |
| `smoke` (mobile) | — | Duplicate `data-testid="Button"` in mobile DOM causes strict mode violation |

All other tests pass reliably across Chromium and mobile Chrome.

---

## AI-assisted development

This suite was built using a human-in-the-loop (HOTL) approach combining manual QA expertise with Claude Code.

The split of responsibility varied by test:

- **`happy-path.spec.ts`** and **`navigation.spec.ts`** — written manually by the human engineer without AI assistance
- **`smoke.spec.ts`**, **`field-validation.spec.ts`**, and **`security.spec.ts`** — built using a HOTL approach: human-defined scenarios, AI-accelerated implementation, human review and approval at every step

Across the suite the human was responsible for test strategy, scenario design, architecture decisions, and bug identification. The AI assisted with implementation speed and pattern consistency. It did not make decisions.

Custom Claude Code slash commands are available for this project:
- `/gherkin` — write and review Gherkin scenarios following project conventions
- `/test_builder` — scaffold a new spec following project patterns

---

## Agentic bug hunt pipeline

Following the initial manual and HOTL session, an automated multi-agent bug hunt pipeline was designed and built on top of the same tooling.

The pipeline is triggered with a single slash command — `/bug-hunt` — and runs 5 specialist agents in sequence, each testing one dimension of the application:

| Agent | Responsibility |
|---|---|
| Security | Console exposure, API key leaks, network traffic analysis |
| Functional | Field validation, form submission, UI state |
| Compliance | EU/EEA blocking, FATF blacklist, country notice accuracy |
| UX | Copy, links, labels, placeholder content |
| Responsive | Layout correctness at 5 viewport widths |

Each agent writes structured JSON findings to `agents/results/`. A sixth report-writer agent reads all outputs, deduplicates findings across agents, assigns severity and BUG-IDs, and produces a dated markdown report — without touching the original `TEST_REPORT.md`.

The initial bug report was produced manually using a HOTL approach. The agentic pipeline was built afterwards to demonstrate how the same process can be automated and repeated against future builds.

Agent prompts live in `agents/`. Shared configuration (target URL, output schema, severity definitions) is centralised in `agents/context.md` — each agent reads it rather than repeating the same boilerplate. Trigger the full pipeline with `/bug-hunt` in Claude Code.
