# Test Report — Trading Account Registration Form
**Application:** Purple Lab — Tradit Ltd. Registration Form  
**URL:** https://my-qbgzo-qacs4.vgabriel.personal.purple-lab.dev/register  
**Tester:** Pavel Andrassi  
**Date:** 2026-04-28  
**Environment:** Desktop — Chrome (macOS), DevTools inspection  
**AI Collaboration:** Claude Code used for bug analysis, root cause investigation, and report structuring  

---

## Executive Summary

A manual and AI-assisted inspection of the trading account registration form revealed **27 confirmed bugs** and **4 observations**, spanning security, infrastructure, compliance, and UX categories.

The most critical finding is a **P0 security vulnerability**: the user's password is logged in plain text to the browser console on every keystroke and on every checkbox interaction, via a `console.log()` statement embedded directly inside a React JSX render tree in the production bundle. This affects all users on all environments and constitutes a direct GDPR Article 32 violation.

Three API endpoints fail on page load, indicating a systemic infrastructure misconfiguration where server-side-only APIs are being called directly from the browser without required authorization headers or CORS configuration.

| Severity | Count |
|---|---|
| P0 / Critical Security | 1 |
| Critical | 5 |
| High | 8 |
| Medium | 8 |
| Low | 5 |
| Observation / Info | 4 |
| **Total** | **31** |

---

## Root Cause Groups

### Group A — Infrastructure: API Gateway Failures (BUG-001, BUG-002, BUG-003, BUG-009)

**Root cause:** Multiple AWS API Gateway endpoints fail when called directly from the browser. The pattern across all failures suggests these APIs were designed for server-to-server calls and lack either CORS configuration or client-accessible authorization. The frontend calls them directly without the required headers or credentials.

All failures share the same AWS API Gateway base domain: `topsufmwb5.execute-api.eu-central-1.amazonaws.com` (BUG-001, BUG-002) and a second dead gateway `7ptgk7424l.execute-api.eu-central-1.amazonaws.com` (BUG-003).

---

### Group B — Password Security (BUG-004, BUG-008)

**Root cause:** A `console.log(n.password)` statement was committed directly inside a React JSX render function's `children` array. It was shipped in the production bundle. Because React evaluates all children on every render cycle, the log fires on every keystroke and state change. BUG-004 is the observable symptom; BUG-008 is the confirmed source location.

---

### Group C — Deliberate / Planted Bugs (BUG-007, BUG-010)

**Root cause:** Two bugs show clear signals of being intentionally seeded for this QA case study: the alert loop uses `setTimeout` in a pattern too specific to be accidental, and the Vietnamese error message ("Check local storage") is a developer-facing hint rather than a user-facing message.

---

### Group D — UX, Content, and Navigation (BUG-012 – BUG-017, BUG-020, BUG-021)

**Root cause:** Multiple content and UX defects including broken links, typos, incorrect routing logic, missing UI elements, and incomplete validation hints. These appear to be independent issues across different areas of the form.

---

### Group E — Silent Error Handling (BUG-009, BUG-010, BUG-018)

**Root cause:** Multiple catch blocks swallow errors without surfacing any feedback to the user. The frontend defensive pattern `catch (e) { return }` silently fails across several features, leaving users with no explanation when something goes wrong.

---

## Bug Reports

---

### BUG-001 — CRITICAL ⚠️ TO DISCUSS WITH DEVELOPERS
**Title:** checkCountry CORS preflight blocked — country eligibility check cannot execute  
**Trigger:** Page load  
**Endpoint:** `OPTIONS https://topsufmwb5.execute-api.eu-central-1.amazonaws.com/qacs4/onboarding/checkCountry?countryCode=CZE&brand=AXIORY_GLOBAL`  
**Status:** 403 Forbidden  

**Description:**  
On every page load, the frontend attempts to verify the user's country eligibility by calling the `checkCountry` endpoint. The browser first sends an OPTIONS preflight request (standard CORS negotiation). The API Gateway returns 403, blocking the preflight. The actual GET request never fires.

This endpoint likely also returns a session token required for form submission. Its failure means:
- The user cannot be warned that their country is not eligible before filling the entire form
- The token required for submission may never be established, causing all submissions to fail

**Steps to Reproduce:**
1. Open DevTools → Network tab
2. Navigate to `https://my-qbgzo-qacs4.vgabriel.personal.purple-lab.dev/register`
3. Filter network requests by "checkCountry"

**Expected Result:** OPTIONS preflight returns 200/204, country eligibility check proceeds and warns ineligible users before they fill the form.

**Actual Result:** OPTIONS request returns 403 Forbidden. Preflight is blocked. The actual GET never fires. Country eligibility is never checked.

**Impact:** Compliance gate cannot execute. EU/EEA users receive no early warning. Submission flow may be broken for all users regardless of country.  
**Reproducible:** Yes — every page load  
**Root cause group:** Group A

> **⚠️ Note for discussion:** The CORS 403 may be an environment-configuration artefact — the API Gateway allow-list may not include this staging domain. Needs developer confirmation: does this endpoint work correctly against the production domain? If yes, severity should be reduced to a deployment/config issue rather than a code defect.  

---

### BUG-002 — HIGH ⚠️ TO DISCUSS WITH DEVELOPERS
**Title:** getOutage endpoint returns 403 — maintenance status check fails silently  
**Trigger:** Page load  
**Endpoint:** `GET https://topsufmwb5.execute-api.eu-central-1.amazonaws.com/qacs4/getOutage?timeZone=Europe/Prague`  
**Status:** 403 Forbidden  

**Description:**  
The frontend checks for scheduled maintenance by calling `getOutage` with the user's detected timezone. The endpoint returns 403 directly (no CORS preflight needed for this simple GET). The error is caught silently:

```javascript
try {
    let t = await fetch(`getOutage?timeZone=${e}`)
    let n = await t.json();
    n.from && typeof n.from === "string" && r(true)  // sets outage banner
} catch (e) {
    console.error(e)   // 403 swallowed here — outage banner never shown
} finally {
    t(false)           // loading = false regardless
}
```

The app silently assumes no outage is active. If a real outage is in progress, users see a functional registration form, attempt to submit, and receive no explanation for the failure.

**Steps to Reproduce:**
1. Open DevTools → Network tab
2. Navigate to the registration page
3. Filter network requests by "getOutage"

**Expected Result:** Endpoint returns 200 with outage schedule data. If an outage is active, a maintenance banner is displayed to the user.

**Actual Result:** GET returns 403 Forbidden. Error is caught and swallowed silently. No maintenance banner is ever shown regardless of actual outage status.

**Impact:** Users may register during a real outage with no feedback. Maintenance communication is completely broken.  
**Reproducible:** Yes — every page load  
**Root cause group:** Groups A + E

> **⚠️ Note for discussion:** The 403 may mean this endpoint requires auth credentials the frontend is not sending, or it may be intentionally disabled in this staging environment. **Confirmed bug regardless:** the silent `catch (e) { return }` pattern is wrong in either case — even if the endpoint is unavailable by design, the app should handle the absence of outage data gracefully rather than silently assuming no outage exists.  

---

### BUG-003 — CRITICAL ⚠️ TO DISCUSS WITH DEVELOPERS
**Title:** Affiliate/promo code endpoint points to non-existent API Gateway — feature completely broken  
**Trigger:** Clicking "I have an affiliated code" or "I have promo code" checkbox  
**Endpoint:** `GET https://7ptgk7424l.execute-api.eu-central-1.amazonaws.com/f-end`  
**Error:** `net::ERR_NAME_NOT_RESOLVED`  

**Description:**  
Clicking the affiliate code checkbox triggers a fetch to a different API Gateway (`7ptgk7424l`) with the path `/f-end`. DNS resolution fails completely — this domain does not exist. The API Gateway has either been deleted, was never deployed, or the frontend is pointing at a dead environment.

Source code confirms the silent failure pattern:
```javascript
try {
    if (!(await fetch("https://7ptgk7424l.execute-api.eu-central-1.amazonaws.com/f-end", {
        method: "GET"
    })).ok)
        throw Error("Network response was not ok")
} catch (e) {
    return   // silent fail — user sees nothing
}
```

**Steps to Reproduce:**
1. Navigate to the registration form
2. Check the "I have an affiliated code" checkbox
3. Open DevTools → Network tab and observe

**Expected Result:** An input field appears for the affiliate code. The endpoint validates the code and confirms or rejects it.

**Actual Result:** DNS resolution fails (`net::ERR_NAME_NOT_RESOLVED`). No input field appears. No error message is shown to the user. The checkbox appears checked but has no functional effect.

**Impact:** Affiliate/referral code feature is entirely non-functional. Users with valid referral codes cannot use them. Revenue tracking and partner commissions cannot be attributed.  
**Reproducible:** Yes — every checkbox click  
**Root cause group:** Groups A + E

> **⚠️ Note for discussion:** `ERR_NAME_NOT_RESOLVED` means the domain does not exist at all — this is more severe than a 403, as DNS resolution fails before any request reaches a server. The API Gateway (`7ptgk7424l`) may have been decommissioned or was never deployed for this environment. Needs developer confirmation: is this feature expected to function in this staging branch, or was the endpoint intentionally removed?  

---

### BUG-004 — CRITICAL / SECURITY / P0
**Title:** User password logged in plain text to browser console on every keystroke  
**Trigger:** Every keystroke in the password field; checkbox interactions  
**Source file:** `register-ee0df2c7f80fdac4.js` (production bundle)  

**Description:**  
The password field value is printed to the browser console in plain text on every component re-render. Since the password field is a controlled React input, every keystroke triggers a re-render, which triggers the log. Additional checkbox interactions (e.g., "I agree to terms") also trigger re-renders and additional logs.

Evidence observed: password `@ššššššššffffgdgdfggdf` printed 4× to console after a single checkbox interaction. Character-by-character logging observed during typing.

The field mask (•••••) provides no protection — it is CSS-only. The underlying value is always plain text in JavaScript.

**Steps to Reproduce:**
1. Open DevTools → Console tab
2. Navigate to the registration page
3. Click into the Password field and type any password (e.g. `TestPass123!`)
4. Observe the Console output

**Expected Result:** Console shows no output related to the password field. The masked input (•••) remains the only visible representation of the password.

**Actual Result:** Each character is printed to the console in plain text as it is typed. Additional log entries appear on every checkbox interaction. Example observed: `@ššššššššffffgdgdfggdf` printed 4× after a single checkbox click.

**Impact:**
- Any browser extension with `tabs` permission can silently read console output and exfiltrate passwords
- Browser monitoring SDKs (Sentry, LogRocket, Datadog) may capture and store passwords on third-party servers
- Visible to anyone with DevTools open, recording their screen, or sharing their screen
- GDPR Article 32 violation — failure to implement appropriate technical security measures
- Affects all users on all environments (production bundle confirmed)

**Root cause:**  
A `console.log` was placed directly inside a React JSX `children` array alongside the password input component in the production bundle (`register-ee0df2c7f80fdac4.js`):
```javascript
children: [
    (0, a.jsx)(eA.A, { password: n.password }),   // renders the password input
    console.log(n.password)                         // ← debug statement, never removed
]
```
React evaluates every child in the array on every render cycle. `console.log` executes as a side effect on every keystroke.

**Fix:** Remove `console.log(n.password)` from the JSX children array. Single line deletion. No logic change required.  
**Root cause group:** Group B  

---

### OBS-006 — OBSERVATION (formerly BUG-005)
**Title:** Submit button disabled state is enforced client-side only  
**Trigger:** DOM manipulation via DevTools  

**Description:**  
The submit button carries a `disabled` attribute enforced only in the DOM. Editing the attribute via DevTools (`disabled` → removed) allows the form to submit before all validation is complete. The server correctly returns 403 for invalid submissions, so there is no bypass of server logic.

**Steps to Reproduce:**
1. Navigate to the registration form and leave all fields empty
2. Open DevTools → Elements tab
3. Select the submit button and remove the `disabled` attribute
4. Click the button

**Expected Result:** Submission is still blocked; all fields are validated client-side before the request is sent.

**Actual Result:** The form submits immediately. The server correctly returns 403, so no actual bypass occurs. However, unvalidated data is sent across the wire.

**Note:** This is correct architecture — client-side `disabled` is a UX control only. Server validation is and should be the real safety net. Demoted from bug to observation; no code change required.  

---

### BUG-007 — HIGH
**Title:** "Open Demo Corporate Account" button triggers 16 blocking alert dialogs over 30 seconds  
**Element:** `data-testid="corporateDemoButton"`  

**Description:**  
Clicking the Corporate Demo button executes:
```javascript
onClick: () => {
    window.alert("すぐに登録を完了してください");
    for (let e = 0; e < 15; e++)
        setTimeout(function() {
            window.alert("すぐに登録を完了してください")
        }, 2e3 * (e + 1))
}
```

This fires 1 immediate alert followed by 15 more at 2-second intervals (2s, 4s, 6s… 30s). Once clicked, all 15 timeouts are already scheduled in memory. Closing each dialog does not cancel the queue. The only escape is a full page reload, which causes loss of all form data entered.

The alert message is hardcoded in Japanese only: *"すぐに登録を完了してください"* ("Please complete your registration immediately").

**Steps to Reproduce:**
1. Navigate to the registration form
2. Click the "Corporate" tab
3. Click "Open Demo Corporate Account"

**Expected Result:** User is navigated to a demo account setup page, or an appropriate message is displayed explaining the corporate demo process.

**Actual Result:** An alert dialog appears immediately in Japanese: *"すぐに登録を完了してください"*. Dismissing it triggers another alert 2 seconds later. This repeats 15 more times over 30 seconds. The only escape is a full page reload, causing all entered form data to be lost.

**Issues:**
- Blocks all page interaction for up to 30 seconds
- Japanese-only message on an English-language international form
- Forces page reload — all unsaved form data lost
- Completely inappropriate UX for a financial product

**Root cause group:** Group C (deliberate planted bug)  

---

### BUG-009 — MEDIUM
**Title:** Promo code validation failure silently swallowed — no user feedback  
**Location:** Same source block as BUG-003  

**Description:**  
The promo code fetch function wraps its error handling with `catch (e) { return }`. When the endpoint fails (DNS error, 403, network timeout), the catch block discards the error silently. The user receives no error message, no "service unavailable" notice, and no indication that their promo code was not validated.

**Steps to Reproduce:**
1. Navigate to the registration form
2. Check the "I have an affiliated code" or "I have promo code" checkbox
3. Observe the UI and DevTools Console

**Expected Result:** An input field appears. If the backend is unavailable, an inline error message informs the user ("Promo code service temporarily unavailable").

**Actual Result:** Nothing happens. No input field appears, no error message is shown. The DNS failure is silently swallowed in the catch block.

**Impact:** Users with legitimate promo codes cannot use them and receive no explanation. Support ticket volume expected to increase.  
**Fix:** Add user-facing error handling: display a message such as "Promo code service is temporarily unavailable. Please try again later."  
**Root cause group:** Groups A + E  

---

### BUG-010 — CRITICAL
**Title:** Selecting Vietnamese language crashes the entire React application  
**Trigger:** Clicking Vietnamese in the language selector (`data-testid="languageOptions"`)  

**Description:**  
Selecting Vietnamese throws a real `window.ErrorEvent`:
```
Error: Vietnamese is not supported. Check local storage.
```

This error propagates up the React component tree unhandled, triggering the application error boundary. The entire page collapses to the error screen: *"Our cat took a nap instead of processing your request. Please reload the page and try again."*

All form data entered by the user is lost. The user must reload and start registration from scratch.

The error message "Check local storage" is developer-facing and completely meaningless to an end user.

Additionally, the error is dispatched as a `window.ErrorEvent`, meaning it will be captured by any connected monitoring tool (Sentry, LogRocket, Datadog) — creating noise in production monitoring dashboards.

**Steps to Reproduce:**
1. Navigate to the registration form
2. Click the language selector (flag icon, top-right area)
3. Click "Vietnamese"

**Expected Result:** The page switches to Vietnamese, or displays a graceful message: "Vietnamese language is not yet available." All form data is preserved.

**Actual Result:** A `window.ErrorEvent` is thrown: `"Error: Vietnamese is not supported. Check local storage."` The error propagates through the React tree, triggers the error boundary, and collapses the entire page to: *"Our cat took a nap instead of processing your request."* All form data is lost. On subsequent page reloads, the app remains broken because `i18nextLng: "VI"` is now persisted in localStorage.

**Issues:**
1. Language option available in UI with no functional support behind it
2. Unhandled error crashes the full application (not just the language picker)
3. All form progress lost — no recovery path
4. Developer-facing error message exposed to end users
5. Monitoring tools will receive a stream of false error alerts

**Fix (short term):** Remove Vietnamese from the language selector until translation assets are available.  
**Fix (long term):** Add error boundary around the language selector with a user-friendly fallback message.  
**Root cause group:** Groups C + E  

---

### BUG-011 — HIGH / AUTOMATION BLOCKER
**Title:** Google reCAPTCHA Enterprise present — blocks all automated form submission  
**Found by:** Both  

- **What:** reCAPTCHA Enterprise is active on the registration form
- **Automation impact:** Standard Playwright cannot solve reCAPTCHA challenges — all E2E tests that reach form submission will fail in CI
- **Fix:** Use a test reCAPTCHA site key (Google provides one free for test environments that always returns success), or mock the validation call via `page.route()`

---

### BUG-012 — MEDIUM
**Title:** benefitTile2 link points to an invalid imgur URL  
**Element:** `data-testid="benefitTile2"`  
**URL:** `https://imgur.com/UOBG9Pj`  

**Description:**  
A benefit tile links to an imgur.com URL — a placeholder image hosting service. This is clearly a developer placeholder that was never replaced with the correct destination. Clicking the link takes the user to an imgur page, breaking the registration flow.

**Steps to Reproduce:**
1. Navigate to the registration form
2. Locate the second benefit tile (middle of the left panel)
3. Click the link inside it

**Expected Result:** Link navigates to a relevant page on axiory.com describing the benefit in detail.

**Actual Result:** Browser opens `https://imgur.com/UOBG9Pj` — a third-party image hosting service with no relation to the product.

**Impact:** Trust and credibility damage on a financial platform. Users navigating benefit information are sent off-site to a random image host.  

---

### BUG-013 — HIGH
**Title:** Login prompt link has URL typo and incorrect destination  
**Element:** `data-testid="loginPrompt"`  
**URL:** `https://my-qbgzo-qacs4.vgabriel.personal.purple-lab.dev/registerr`  

**Description:**  
The "Already have an account? Log in" prompt links to `/registerr` — a double-`r` typo that results in a 404. Additionally, even if the typo were corrected, the link destinations to the registration page (`/register`), not the login page. The label says "Log in" but the destination is "Register now" — the complete opposite of the intended action.

**Steps to Reproduce:**
1. Navigate to the registration form
2. Locate the "Already have an account with Axiory?" section
3. Click the "Register now" link

**Expected Result:** User is navigated to the login page.

**Actual Result:** Browser navigates to `/registerr` (double-`r` typo), resulting in a 404 page. Even if the typo were fixed, the destination would be the registration page — the opposite of the intended action.

**Issues:**
1. URL typo (`/registerr`) causes a 404
2. Logic is inverted — existing users directed to registration instead of login
3. The linked page labels the CTA as "Register now" compounding the confusion

---

### BUG-014 — LOW
**Title:** Terms and Conditions link in Notice section has no visual differentiation  
**Element:** `data-testid="Notice"`  

**Description:**  
The Terms and Conditions link within the notice text is not visually distinguishable from surrounding body text (no underline, no color change, no hover state). Users may not recognise it as a clickable link, reducing the likelihood they read the T&C before agreeing — which also has legal implications for a regulated financial product.

**Steps to Reproduce:**
1. Navigate to the registration form
2. Locate the notice/disclaimer text below the Country of Residence field
3. Observe the "Terms and Conditions" text within the notice

**Expected Result:** The T&C link is visually distinct from surrounding text — underlined, a different colour, and/or with a hover state change.

**Actual Result:** The link is rendered with identical styling to the surrounding body text. It is not visually identifiable as a clickable element.

---

### BUG-015 — LOW
**Title:** CTA button text reads "Start trending" instead of "Start trading"  
**Element:** `data-testid="Button"`  

**Description:**  
The primary call-to-action button contains a typo: "Start trending" instead of "Start trading". On a trading platform, this undermines professional credibility and trust.

**Steps to Reproduce:**
1. Navigate to the registration form
2. Look at the primary submit button at the bottom of the form

**Expected Result:** Button label reads "Start trading".

**Actual Result:** Button label reads "Start trending".

---

### BUG-016 — HIGH
**Title:** Switzerland modal creates an infinite loop — user cannot proceed or exit  
**Trigger:** Selecting Switzerland as country → clicking Disagree in the Switzerland modal  

**Description:**  
Selecting Switzerland triggers a compliance modal. Two issues exist:

1. **Disagree path:** Clicking `data-testid="switzerlandModalDisagreeButton"` redirects the user to `axiory.com`. Pressing the browser Back button returns to the registration page — but the modal is still present and the Disagree button is still visible. The user cannot close the modal, cannot dismiss it, and cannot navigate away without leaving the site entirely. This is an infinite loop with no escape.

2. **Agree path:** The Agree button is enabled by default without requiring the user to read or scroll through the modal content — breaking standard UX patterns for consent flows on financial platforms.

**Steps to Reproduce:**
1. Navigate to the registration form
2. Open the Country of Residence dropdown and select "Switzerland"
3. A compliance modal appears — click "Disagree"
4. Browser redirects to `axiory.com` — press the browser Back button

**Expected Result:** After disagreeing, user is returned to the form with the modal dismissed and a clear message that they cannot proceed.

**Actual Result:** Back button returns to the registration page with the modal still open. The Disagree button is still visible and clicking it repeats the redirect. There is no way to close the modal and continue — user is stuck in an infinite loop.

**Impact:**
- Users who disagree are trapped with no escape short of closing the browser tab
- The consent flow for Switzerland is legally non-compliant in its current state

---

### BUG-017 — MEDIUM
**Title:** "Open Live Corporate Account" button produces silent failure  
**Element:** `data-testid="corporateLiveButton"`  

**Description:**  
Clicking "Open Live Corporate Account" produces no visible response to the user. No UI change, no navigation, no feedback. A console error is logged in Japanese (matching the locale of BUG-007), but no network request is created. The button appears non-functional with no explanation provided.

**Steps to Reproduce:**
1. Navigate to the registration form
2. Click the "Corporate" tab
3. Click "Open Live Corporate Account"

**Expected Result:** User is navigated to a live corporate account setup page or an appropriate message is displayed.

**Actual Result:** Nothing happens. No navigation, no modal, no message. A console error appears in Japanese. No network request is created.

**Issues:**
- Silent failure with zero user feedback
- Console error in Japanese on an English-language form (same pattern as BUG-007)
- UX inconsistency: the Demo button (BUG-007) produces destructive alerts; the Live button does nothing

---

### BUG-018 — MEDIUM
**Title:** Password validation hint is incomplete — number requirement not communicated  
**Field:** Password input  

**Description:**  
The password field displays validation hints, but the hint text does not mention that a number is required. Testing confirms numbers are in fact required by the validation logic. Users attempting to set a letter-only password receive a validation error for a requirement they were never told about.

Additionally, the password field has no maximum character length enforced or communicated.

**Steps to Reproduce:**
1. Navigate to the registration form
2. Click into the Password field
3. Read the validation hint text displayed below the field
4. Type a password consisting of letters only (e.g. `abcdefgh`) and observe the validation result

**Expected Result:** The hint text lists all password requirements including: minimum 6 characters, must contain a number, no leading/trailing spaces.

**Actual Result:** The hint reads only: *"Invalid password format. Please use at least 6 characters and avoid starting or ending with a space."* No mention of a number requirement. A letters-only password may pass client-side validation while failing server-side rules — or the strength meter misleads users into thinking it is acceptable.

**Impact:** Poor UX — users fail validation for undisclosed requirements. Increased form abandonment.  

---

### BUG-019 — LOW
**Title:** Language selector label displays only "English" regardless of selection  
**Element:** `data-testid="languageOptions"`  

**Description:**  
The language selector label always shows "English" and does not update to reflect the currently selected language. Users cannot confirm which language is active after switching (where switching doesn't cause a crash — see BUG-010).

**Steps to Reproduce:**
1. Navigate to the registration form
2. Click the language selector
3. Select any language other than English (e.g. Spanish) that does not crash the app
4. Observe the language selector label

**Expected Result:** The label updates to show the newly selected language name.

**Actual Result:** The label continues to show "English" regardless of the selected language.

---

### BUG-022 — MEDIUM / COMPLIANCE
**Title:** Iran displayed with incorrect name format in the Country dropdown  
**Element:** `data-testid="country"` — Country of Residence dropdown  
**Found by:** Human  

Iran appears in the Country of Residence dropdown as `Iran (ایران), Islamic Republic of`. All other countries follow the format `Name (Native Name)`. The extra text at the end is inconsistent and looks broken.

Additionally, based on the platform's AML-CFT Policy, Iran should either be blocked at submission or removed from the dropdown entirely.

**Steps to Reproduce:**
1. Open the Country of Residence dropdown
2. Search for Iran

**Expected Result:** Iran displays as `Iran (ایران)` consistent with all other entries, or is absent from the dropdown.

**Actual Result:** Iran displays as `Iran (ایران), Islamic Republic of`.

**Fix:** Correct the country name in the data source. Confirm with developers whether Iran should be blocked or removed based on AML-CFT Policy.

---

### BUG-024 — HIGH
**Title:** Password strength meter shows "Strong" for a weak 6-character lowercase-only password; indicator color contradicts the label  
**Found by:** Human (manual testing); confirmed by AI via DOM inspection  
**Severity:** High — misleads users into thinking a weak password meets security requirements  

**Evidence:**
```html
<!-- After entering "abcdef" (6 chars, lowercase only, no digits, no symbols) -->
<span color="#ff4b80" data-testid="Text">Strong</span>
```

**Issues:**
1. **Incorrect classification:** "abcdef" is objectively weak — 6 lowercase letters, no uppercase, no digits, no symbols. The meter labels it "Strong".
2. **Color-text contradiction:** The element renders the text "Strong" in color `#ff4b80` — a pink/red tone. Red/pink conventionally signals weak or error states, directly contradicting the "Strong" label.

**Impact:** Users may submit a genuinely weak password believing it satisfies security requirements. The misleading strength indicator could result in accounts with easily brute-forced passwords.

**Steps to Reproduce:**
1. Navigate to the registration form
2. Click into the Password field
3. Type "abcdef" (6 lowercase letters, no digits, no symbols, no uppercase)
4. Observe the password strength indicator

**Expected Result:** Strength meter shows "Weak" or "Very Weak" with a red indicator.

**Actual Result:** Strength meter shows "Strong" in color `#ff4b80` (pink/red tone) — both the classification and the color are wrong.

**Fix:** Recalibrate the strength algorithm (minimum entropy, character class diversity, length requirements). Align indicator color with actual strength level (green for Strong, red for Weak).

---

### BUG-027 — MEDIUM
**Title:** Submit button label reads "Start trending" instead of "Start trading"  
**Found by:** Human first (also logged as BUG-015); confirmed independently by AI  
**Severity:** Medium — copy error on the primary CTA; undermines brand trust  

**Evidence:**
```html
<button type="submit">
  <div data-testid="Text">Start trending</div>
</button>
```
Accessibility snapshot confirms: `button "Start trending"`. Expected: "Start trading".

**Steps to Reproduce:**
1. Navigate to the registration form
2. Scroll to the bottom of the form and read the submit button label

**Expected Result:** Button label reads "Start trading".

**Actual Result:** Button label reads "Start trending".

**Impact:** The primary call-to-action on a financial services registration form contains a visible typo. "Trending" is a social-media term; "trading" is the product. Any QA check or user reading the button carefully will catch this immediately.

**Fix:** Change button label from "Start trending" to "Start trading".

---

### BUG-030 — CRITICAL
**Title:** T&C checkbox cannot be checked through normal user interaction — form permanently unsubmittable  
**Element:** `input[name="agreeConditions"]`  
**Found by:** Both — Human (cannot check manually), AI (confirmed via React fiber inspection)  
**Severity:** Critical — no real user can submit the registration form

**Description:**  
The Terms & Conditions checkbox cannot be successfully checked through standard mouse interaction. The checkbox label element intercepts all pointer events before they reach the underlying `<input>` element. While the DOM checkbox visually appears to check, Formik's internal form state never receives the change event and keeps `agreeConditions` in an error state (`"errors.terms_agree"`), leaving `isValid: false` and the submit button permanently disabled.

Confirmed via React fiber inspection with all other fields fully valid:
```javascript
// Formik state with all fields filled correctly and checkbox visually checked:
{
  errors: { "agreeConditions": "errors.terms_agree" },
  values: { "agreeConditions": true },   // DOM says true
  isValid: false                          // Formik still invalid
}
```

The DOM value reports `true` (checked) but Formik's validator fires because it never received a proper synthetic React change event — only a native DOM click that bypassed React's event system.

**Steps to Reproduce:**
1. Navigate to the registration form
2. Fill all fields with valid data (First Name, Last Name, Email, Password, Country)
3. Click the "I agree with Terms and Conditions" checkbox
4. Observe the submit button

**Expected Result:** Checkbox registers as checked in both the DOM and the form's internal state. Submit button becomes enabled.

**Actual Result:** Checkbox appears visually checked. Submit button remains disabled. Formik continues to report `agreeConditions` as invalid. The form cannot be submitted by any real user through normal interaction.

**Impact:**  
This is the most user-facing blocking bug in the entire form. Combined with BUG-001 (country check CORS failure), **100% of users are blocked from submitting the form** — there is no path to successful registration for any user under any circumstances without developer intervention.

**Fix:** Ensure the checkbox `<input>` element receives React synthetic change events. Remove or restructure the label so it does not intercept pointer events on the input. Use `onChange` handler directly on the input, or use `htmlFor` + correct `id` pairing without overlapping click areas.

**Automation confirmation:**  
Independently confirmed during test implementation in `tests/happy-path.spec.ts`. Using Playwright's `check({ force: true })` — which bypasses actionability checks and clicks the DOM element directly, bypassing the label interception — the submit button still remained disabled for the full 30-second timeout. This proves the bug is not just a pointer-event interception issue: even a direct DOM-level click is insufficient because React's synthetic event system never fires, and Formik's state never updates. This is consistent with the React fiber findings above.

---

### BUG-031 — MEDIUM
**Title:** Country-specific Terms & Conditions link points to a placeholder URL instead of the legal document  
**Element:** Link inside the country notice — *"Under the selected country of residence, your account will be created under Axiory Global Ltd. Please read the applicable Terms and Conditions"*  
**Found by:** Human  

**Description:**  
After selecting a valid non-restricted country (e.g. Japan), a notice appears below the country field with a link to the applicable Terms & Conditions. The link resolves to `https://http.dog/200.jpg` — a developer joke/placeholder site that displays HTTP status codes as dog photos. This is clearly a placeholder URL that was never replaced before release.

**Steps to Reproduce:**
1. Navigate to the registration form
2. Select "Japan" as the country of residence
3. Observe the notice that appears below the country field
4. Hover over or click the "Terms and Conditions" link

**Expected Result:** Link points to the applicable legal document — `https://www.axiory.com/Axiory/media/assets/doc/Tradit_Terms-Conditions.pdf`

**Actual Result:** Link points to `https://http.dog/200.jpg` — a placeholder URL serving a dog photo.

**Impact:** Users cannot access the legally required Terms & Conditions document before registering. On a regulated financial platform this is a compliance and legal risk — users are agreeing to terms they cannot read.  
**Root cause group:** Group D

---

## AI-Only Findings

*The following bugs were discovered exclusively through AI-assisted testing (Playwright MCP, DOM inspection, network analysis). They had no human-observed counterpart in the original manual test session.*

---

### AI-001 — MEDIUM
**Title:** Page title contains "blablabla" placeholder text  
**Found by:** AI (DOM title inspection)  
**Evidence:** `Page Title: Open trading account - AXIORY blablabla`  

The HTML `<title>` tag contains placeholder text that was never replaced. Visible in browser tab, browser history, search engine indexing, and social share previews. Damages credibility and SEO for a regulated financial product.

**Steps to Reproduce:**
1. Navigate to the registration page
2. Look at the browser tab title

**Expected Result:** Title reads "Open a Trading Account — AXIORY" or equivalent professional copy.

**Actual Result:** Title reads "Open trading account - AXIORY blablabla".

---

### AI-002 — LOW
**Title:** "High Quality Customer Sport" — missing word in section heading  
**Found by:** AI (accessibility snapshot)  
**Evidence:** `generic [ref=e77]: High Quality Customer Sport`  

Section heading reads "High Quality Customer Sport" — the word "Support" has been truncated to "Sport". Missed in visual review as the layout looks normal at a glance.

**Steps to Reproduce:**
1. Navigate to the registration form
2. Read the third benefit section heading in the left panel

**Expected Result:** Heading reads "High Quality Customer Support".

**Actual Result:** Heading reads "High Quality Customer Sport".

---

### AI-003 — TO DISCUSS WITH DEVELOPERS
**Title:** ipstack API key exposed in plain text network request URL  
**Found by:** AI (network request inspection)  
**Evidence:** `GET https://api.ipstack.com/check?access_key=53ef4bf7cc1918d33db8b2f2e421fc54`  

The application calls ipstack (IP geolocation service) to detect the user's country on page load. The API key is passed as a URL query parameter in plain text. This key will appear in:
- Browser history of every user
- Server access logs
- CDN and proxy logs
- Any analytics/monitoring tool capturing network requests

A leaked API key allows anyone to make requests against the team's ipstack quota or use it for their own geolocation lookups at the team's expense.

**Steps to Reproduce:**
1. Open DevTools → Network tab
2. Navigate to the registration page
3. Filter requests by "ipstack"

**Expected Result:** No direct ipstack calls visible from the browser. Geolocation is handled server-side with the API key stored securely.

**Actual Result:** `GET https://api.ipstack.com/check?access_key=53ef4bf7cc1918d33db8b2f2e421fc54` is visible in plain text in the browser's network requests.

**Fix:** Move the ipstack call server-side. Never expose third-party API keys in browser-visible requests.

---

### BUG-023 — CRITICAL
**Title:** First Name and Last Name fields have swapped `name` attributes and `data-testid` values — every submitted form reverses the user's name  
**Found by:** AI (DOM deep inspection via `page.evaluate()`)  
**Severity:** Critical — data integrity failure, affects every submission  

**DOM evidence:**
```html
<!-- Visual label says "First name" — but the field submits as lastName -->
<div data-testid="lastName">
  <label for="«r0»">First name</label>
  <input name="lastName" value="..." data-state="ok">
</div>

<!-- Visual label says "Last name" — but the field submits as firstName -->
<div data-testid="firstName">
  <label for="«r1»">Last name</label>
  <input name="firstName" value="..." data-state="ok">
</div>
```

**Impact:**  
- Every user who fills in the form has their first and last name stored reversed in the backend  
- The visual form looks correct (labels read "First name" / "Last name") — the swap is invisible to users  
- All submitted profiles will have inverted identity data — a KYC/compliance risk  
- The `data-testid` swap also means any automated test targeting `data-testid="firstName"` is actually interacting with the Last Name field  

**Steps to Reproduce:**
1. Navigate to the registration form
2. Open DevTools → Elements tab
3. Inspect the "First name" input element

**Expected Result:** The input labelled "First name" has `name="firstName"` and `data-testid="firstName"`. The input labelled "Last name" has `name="lastName"` and `data-testid="lastName"`.

**Actual Result:** The input labelled "First name" has `name="lastName"` and `data-testid="lastName"`. The input labelled "Last name" has `name="firstName"` and `data-testid="firstName"`. Every form submission stores the user's names in reverse order.

**Fix:** Align `name`, `id`, `data-testid`, and `<label for>` on each field. "First name" label → `name="firstName"` / `data-testid="firstName"`.

---

### BUG-025 — HIGH
**Title:** Submit button broken at multiple viewport widths — collapsed or hidden depending on screen size  
**Found by:** AI (DOM class attribute inspection)  

The submit button has multiple CSS classes that make it unusable at specific viewport widths. These appear to be debug or test styles that were never removed before release.

**Affected breakpoints:**

| Viewport | Class | Behaviour |
|---|---|---|
| ≤440px (iPhone SE, iPhone 14, most Android phones) | `max-[440px]:max-w-[12px]` | Button collapses to 12px wide — invisible and untappable |
| 755–785px (landscape phones, narrow desktop windows) | `min-[755px]:max-[785px]:hidden!` | Button completely hidden (`display: none`) |

**Steps to Reproduce:**
1. Open the registration page in browser DevTools
2. Set viewport to 375px — submit button collapses to 12px wide
3. Set viewport to 770px — submit button disappears entirely

**Expected Result:** Submit button is visible and usable at all viewport widths.

**Actual Result:** Button is broken at two separate breakpoints covering a wide range of real devices.

**Fix:** Remove both `max-[440px]:max-w-[12px]` and `min-[755px]:max-[785px]:hidden!` classes from the button.

---

## Observations

### OBSERVATION-001 — INFO
**Title:** Email field silently strips leading/trailing whitespace  
**Input tested:** `"    x@gmail.com"` (4 leading spaces)  
**DOM value:** `x@gmail.com`  

This is HTML spec-compliant behaviour for `type="email"` inputs. The browser normalises the value before it reaches JavaScript. The form relies on browser normalisation rather than explicit input sanitisation. Recommend testing spaces mid-string (`x @gmail.com`) which the browser does NOT strip — this may expose a validation gap.

---

### OBSERVATION-002 — INFO
**Title:** Live chat referenced in support text but widget not present  

The page text states: *"If you need help, just contact our customer support at support@axiory.com or via live chat in the bottom-right corner."* No live chat widget is visible in the bottom-right corner on desktop or mobile viewport. Either the widget failed to load or the support copy is outdated.

---

### OBSERVATION-003 — INFO
**Title:** reCAPTCHA fires on page reload after error  

After BUG-010 (Vietnamese crash), reloading the page triggers a reCAPTCHA Enterprise PAT check. This suggests bot-detection is monitoring reload frequency. Relevant for automation strategy — excessive test retries may trigger bot protection.

---

### OBS-001 — OBSERVATION
**Title:** Email field silently strips all whitespace from input  
**Found by:** AI (DOM value inspection after typing)  
**Severity:** Low — silent input transformation, no user feedback  

**Steps to Reproduce:**
1. Navigate to the registration form
2. Type `"te st@gmail.com"` (with a space mid-string) into the Email field
3. Click away to trigger blur validation
4. Inspect the field value via DevTools

**Expected Result:** Field shows a validation error ("Email cannot contain spaces"), or the value is stored exactly as typed and validated.

**Actual Result:** The space is silently removed. The field stores `"test@gmail.com"` and shows a valid state — the user has no indication their input was modified.

**Evidence:**
- `" test@gmail.com"` (leading space) → stored as `"test@gmail.com"` → state: `ok`  
- `"te st@gmail.com"` (mid-string space) → stored as `"test@gmail.com"` → state: `ok`  
- `"test@gmail.com "` (trailing space) → stored as `"test@gmail.com"` → state: `ok`  

**Consideration:** Since spaces are never valid in email addresses, stripping them and accepting is technically correct. However, silently transforming user input without feedback is a UX antipattern — if someone types `john .doe@example.com` they will not know their email was modified. The field should either reject spaces with an error message ("Email cannot contain spaces") or strip and show a toast/inline notice.

---

## Automation Strategy

### Flows Suitable for Automation `[AUTO]`

| Flow | Priority | Notes |
|---|---|---|
| Happy path — valid registration (non-EU country) | `@smoke` | Core flow, must pass on every deploy |
| EU country blocked at submission | `@smoke @compliance` | Regulatory requirement |
| Field validation — each field, invalid input | High | Equivalence partitioning coverage |
| Password rules enforcement | High | Requirements must match hint text |
| Duplicate email rejection | High | Server-side uniqueness check |
| Affiliate code checkbox — feature unavailable | Medium | Currently broken (BUG-003) |
| Switzerland modal — agree path | Medium | Compliance flow |
| Language selector — supported languages only | Medium | Exclude Vietnamese (BUG-010) |
| Mobile viewport — happy path at 375px | Medium | Touch targets, layout |
| Submit button — disabled state before all fields valid | Low | UX guard |

---

## CI/CD Data Handling Strategy

**Challenge:** Registration requires unique email addresses and phone numbers per submission. Re-running tests in CI will collide on previously registered data.

**Solution:**
```typescript
// fixtures/test-data.factory.ts
import { faker } from '@faker-js/faker';

export function generateRegistrationData(workerIndex: number) {
  return {
    email: `test_w${workerIndex}_${faker.string.uuid()}@mailtest.com`,
    phone: `+1${workerIndex}${faker.string.numeric(9)}`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password: `Test${faker.string.alphanumeric(8)}1!`,
  };
}
```

- `workerIndex` prevents collisions between parallel test workers
- `uuid()` ensures uniqueness across CI runs
- No persistent state required — each run generates fresh data
- Email prefix pattern (`test_`) allows easy cleanup via API if needed

---

## Summary Table

| ID | Title | Severity | Root Cause Group |
|---|---|---|---|
| BUG-004 | Password logged to console — every keystroke | P0 / Critical Security | B |
| BUG-008 | console.log(password) in JSX render tree | P0 / Critical Security | B |
| BUG-001 | checkCountry CORS preflight 403 ⚠️ | Critical | A |
| BUG-003 | Affiliate endpoint — DNS failure ⚠️ | Critical | A |
| BUG-007 | Corporate Demo — 16 alert dialogs | Critical | C |
| BUG-010 | Vietnamese crashes entire app | Critical | C + E |
| BUG-002 | getOutage 403 — silent fail ⚠️ | High | A + E |
| BUG-011 | reCAPTCHA Enterprise — automation blocker | High | — |
| BUG-013 | Login link — typo + wrong destination | High | D |
| BUG-016 | Switzerland modal — infinite loop | High | D |
| BUG-017 | Live Corporate button — silent failure | Medium | E |
| BUG-009 | Promo code error silently swallowed | Medium | A + E |
| BUG-018 | Password hint missing number requirement | Medium | D |
| OBS-006 | Submit button client-side only (demoted to observation) | Info | — |
| BUG-012 | benefitTile2 links to imgur placeholder | Medium | D |
| BUG-014 | T&C link not visually differentiated | Low | D |
| BUG-015 | "Start trending" typo | Low | D |
| BUG-019 | Language label always shows "English" | Low | D |
| BUG-031 | Country T&C link points to placeholder URL | Medium | D |
| OBS-001 | Email field strips whitespace (spec-compliant) | Info | — |
| OBS-002 | Live chat referenced but not present | Info | — |
| OBS-003 | reCAPTCHA fires on reload after error | Info | — |

---

---

## AI vs Human Comparison — Who Found What

This section documents the parallel testing run: Pavel tested manually via browser DevTools, Claude tested independently via Playwright MCP tools. Findings are attributed to show the value and blind spots of each approach.

| ID | Title | Human | AI | Notes |
|---|---|---|---|---|
| BUG-001 | checkCountry CORS preflight 403 | ✅ | ✅ | Both found. AI confirmed exact CORS error message from console. |
| BUG-002 | getOutage 403 — silent fail | ✅ | ✅ | Both found. AI confirmed it is also a CORS error, not just 403. |
| BUG-003 | Affiliate endpoint DNS failure | ✅ | ✅ | Both found. AI confirmed `ERR_NAME_NOT_RESOLVED` in console. |
| BUG-004 | Password logged to console | ✅ | ✅ | Both found. AI confirmed character-by-character logging with proof: `T` → `Te` → `Tes` → `TestPassword123!`, twice per keystroke. |
| OBS-006 | Submit button client-side only (demoted — correct architecture) | ✅ | — | Human only — required DOM manipulation. Demoted to observation: server validates correctly, client disabled is appropriate UX. |
| BUG-007 | Corporate Demo — 16 alert dialogs | ✅ | — | Human only — alert dialogs block Playwright execution. |
| BUG-008 | console.log(password) in JSX source — merged into BUG-004 | ✅ | ✅ | Merged into BUG-004 as root cause. |
| BUG-009 | Promo code error silently swallowed | ✅ | ✅ | Both found via source inspection. |
| BUG-010 | Vietnamese crashes app | ✅ | ✅ | **AI escalated severity**: confirmed crash persists via `localStorage` poisoning (`i18nextLng: "VI"`). User permanently locked out until localStorage cleared. |
| BUG-011 | reCAPTCHA Enterprise blocks automation | ✅ | ✅ | Both found. AI confirmed via network requests on page load. |
| BUG-012 | benefitTile2 → imgur placeholder URL | ✅ | ✅ | Both found. AI confirmed via DOM snapshot. |
| BUG-013 | Login link typo `/registerr` + wrong dest | ✅ | ✅ | Both found. AI confirmed `link "Register now" /url: /registerr` in snapshot. |
| BUG-014 | T&C link not visually differentiated | ✅ | — | Human only — visual judgement. |
| BUG-015 | "Start trending" typo | ✅ | ✅ | Both found. AI confirmed `button "Start trending" [disabled]` in snapshot. |
| BUG-016 | Switzerland modal infinite loop | ✅ | — | Human only — requires specific country selection flow. |
| BUG-017 | Live Corporate button silent failure | ✅ | — | Human only — required manual click. |
| BUG-018 | Password hint missing number requirement | ✅ | — | Human only — visual/UX review. |
| BUG-019 | Language selector labels all show "English" | ✅ | ✅ | Both found. AI snapshot confirmed all 6 listitem options labeled "English". |
| **AI-001** | **Page title contains "blablabla" placeholder** | — | ✅ | **AI exclusive.** Page title: `"Open trading account - AXIORY blablabla"`. Placeholder text shipped to production. |
| **AI-002** | **"High Quality Customer Sport" — typo** | — | ✅ | **AI exclusive.** Section heading missing "Support" → reads "Sport". Found via DOM accessibility snapshot. |
| **AI-003** | **ipstack API key exposed in network URL** | — | ✅ | **AI exclusive. To discuss with developers.** `GET https://api.ipstack.com/check?access_key=53ef4bf7cc1918d33db8b2f2e421fc54` — API key visible in plain text in network requests. |
| **BUG-022** | **Iran malformed name + compliance question** | ✅ | — | **Human exclusive.** `"Iran (ایران), Islamic Republic of"` — ISO suffix appended incorrectly. Iran is FATF blacklisted — should be blocked or removed from dropdown. |
| **BUG-023** | **First/Last Name fields have swapped `name` + `data-testid`** | — | ✅ | **AI exclusive.** DOM deep-inspection revealed `name="lastName"` under "First name" label and vice versa. Every submission inverts the user's name. Critical data integrity failure. |
| **BUG-024** | **Password "Strong" label for 6-char lowercase-only password** | ✅ | ✅ | **Both. Human found first.** AI confirmed via DOM inspection: `<span color="#ff4b80">Strong</span>` — wrong classification and contradictory colour both verified. |
| **BUG-025** | **Submit button broken at multiple viewports (collapsed + hidden)** | — | ✅ | **AI exclusive.** ≤440px → collapses to 12px wide. 755–785px → completely hidden. Both caused by debug CSS classes left in production. BUG-031 merged here. |
| **BUG-027** | **Submit button reads "Start trending" not "Start trading"** | ✅ | ✅ | **Both. Human found first** (also logged as BUG-015). AI confirmed independently via DOM text extraction and accessibility snapshot. |
| **OBS-001** | **Email field silently strips all whitespace** | — | ✅ | **AI exclusive.** Leading, trailing, and mid-string spaces are stripped without user feedback. `"te st@gmail.com"` → accepted as `"test@gmail.com"`. Silent input transformation is a UX antipattern. |
| **OBS-002** | **Password: minimum 6 chars enforced, leading/trailing spaces rejected** | ✅ | ✅ | **Both.** 5-char password → error; 6-char accepted. Password starting or ending with space → error. Validation working as documented in error hint. |
| **OBS-003** | **Password: no maximum length enforced** | ✅ | ✅ | **Both.** 300-character password accepted without error. No server-side length cap visible on the client. |
| **OBS-004** | **Email: missing `@` or domain properly rejected** | ✅ | ✅ | **Both.** `testgmail.com`, `test@` → error state. Basic email format validation works correctly. |
| **OBS-005** | **Name: spaces-only rejected as "Required"** | ✅ | ✅ | **Both.** Whitespace-only input treated as empty — field shows "Required" error. Correct behaviour. |
| **BUG-030** | **T&C checkbox cannot be checked — form permanently unsubmittable** | ✅ | ✅ | **Both. Human found first.** Label intercepts pointer events; Formik never receives change event. React fiber confirmed: `errors: { agreeConditions: "errors.terms_agree" }` with `isValid: false` even when all other fields are valid. Most impactful bug in the form. |
| **BUG-031** | **Country T&C link points to placeholder URL** | ✅ | — | **Human exclusive.** Found during test implementation — link resolves to `https://http.dog/200.jpg` instead of the legal T&C PDF. |

---

## Testing Methodology Summary

| Method | Coverage | Unique value |
|---|---|---|
| Human manual testing | Deep UX, visual, compliance flows | Switzerland modal, alert dialogs, source code inspection, password hints |
| AI Playwright MCP | DOM structure, console/network, localStorage, systematic repetition | Placeholder title, API key exposure, localStorage poisoning, password keystroke log proof |

**Total bugs found:**
- Human only: 9
- AI only: 7
- Both independently: 19
- **Combined total: 35 findings**

---

*Report generated with AI-assisted analysis using Claude Code. All findings verified manually via DevTools inspection, source code review, and direct form interaction. AI used for root cause explanation, bug categorisation, DOM inspection, and parallel independent testing. All technical conclusions reviewed and confirmed by the tester.*
