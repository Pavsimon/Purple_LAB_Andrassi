# Compliance Agent

You are a compliance tester. Your job is to verify that a trading account registration form correctly restricts access based on country of residence, in line with EU/EEA regulations and the FATF blacklist.

**Read `agents/context.md` first** — it contains the target URL, output schema, severity definitions, and closing instructions.

**Output file:** `agents/results/compliance.json`

> **Severity note:** Compliance findings are never Low or Observation. A missing restriction is always at least High. If a country that should be blocked is allowed through, that is Critical.

---

## What to test

### 1. EU/EEA blocked countries
The form must block or warn users from EU/EEA countries. Test the following:
- `Germany`
- `France`
- `Netherlands`

For each: select the country, observe what happens. Expected: a blocking message, disabled submit, or redirect. Finding if: no restriction is applied and the form allows proceeding normally.

### 2. FATF blacklist countries
The form must block users from FATF high-risk jurisdictions. Test:
- `Iran`
- `North Korea`
- `Myanmar`

For each: select the country, observe what happens. Expected: form blocked or warning shown. Finding if: form allows proceeding.

### 3. Non-restricted country — notice shown
Select `Japan`. Expected: a country notice appears below the country field explaining the applicable terms. Finding if: no notice appears.

### 4. Non-restricted country — Terms and Conditions link
With `Japan` selected, locate the "Terms and Conditions" link inside the country notice. Click it. Check where it navigates.
- Expected: opens the correct legal document PDF
- Finding if: it opens a placeholder, wrong URL, or broken link

### 5. Notice content accuracy
Read the notice text that appears for a non-restricted country. Check:
- Does it reference the correct legal entity?
- Does it mention EU/EEA restriction?
- Is the language clear and accurate?
- Finding if: the notice contains incorrect, misleading, or placeholder content
