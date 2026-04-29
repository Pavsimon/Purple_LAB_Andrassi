# Bug Hunt — Test Report Generation Prompt

Use this prompt to generate or regenerate the test report from scratch, incorporating both manual findings and AI-assisted testing.

---

## The Prompt

You are a Senior QA Engineer conducting a thorough bug hunt on a web application registration form. The application under test is a trading account registration form at `https://my-qbgzo-qacs4.vgabriel.personal.purple-lab.dev/register`.

Your task is to identify all defects, issues, and observations across the following dimensions:

- **Security** — exposed credentials, API keys, console logging of sensitive data
- **Infrastructure** — failing API calls, CORS misconfigurations, DNS failures
- **Compliance** — restricted countries, AML-CFT policy, EU/EEA restrictions, FATF blacklist
- **Functional** — broken buttons, silent failures, wrong routing, form validation
- **UX / Content** — typos, placeholder text left in production, broken links, misleading copy
- **Responsive / Mobile** — layout issues at 375px, 440px, 900px viewports
- **Accessibility** — touch target sizes, visual differentiation of interactive elements

For each issue found, document it with the following structure:

```
### BUG-XXX — SEVERITY
**Title:** Short description of the issue
**Element / Endpoint:** Affected selector, URL, or file
**Found by:** Human / AI / Both (note who found it first)

**Description:**
What is happening and why it matters.

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:** What should happen.

**Actual Result:** What actually happens.

**Impact:** Business, user, or compliance consequence.
**Root cause group:** Which group this belongs to (see below).
```

---

## Existing Findings to Incorporate

I have already identified the following issues during manual testing. Include all of them in the report, attributed as **Human** findings. Do not discard or merge them without flagging it explicitly.

[PASTE YOUR MANUAL FINDINGS HERE — bullet points, raw notes, screenshot descriptions, or any format you have]

Any additional issues you discover independently should be attributed as **AI** findings. Where you find the same issue already listed above, mark it as **Both** and note which side found it first.

---

## Report Structure to Follow

Produce the full report in the following order:

**1. Header**
Application name, URL, tester name, date, environment, AI collaboration note.

**2. Executive Summary**
Overview paragraph highlighting the most critical finding. Severity breakdown table (P0 / Critical / High / Medium / Low / Observation).

**3. Root Cause Groups**
Group related bugs under named root cause categories (e.g. Group A — Infrastructure, Group B — Security, Group C — Deliberate/Planted Bugs, Group D — UX & Content, Group E — Silent Error Handling). Explain the shared pattern per group.

**4. Bug Reports**
Full detail for every finding found by Human or Both, using the structure above. Assign sequential BUG-XXX IDs.

**5. AI-Only Findings**
A separate section for findings discovered exclusively by AI with no human-observed counterpart. Use the same BUG-XXX ID sequence (not a separate AI-XXX series). Open the section with a short note explaining these findings had no human counterpart. If a finding turns out to have been seen by both sides, move it into section 4 and mark it "Both".

**6. Observations**
A separate section for behaviours worth noting that are not confirmed bugs — spec-compliant edge cases, correct-architecture patterns that look suspicious, or findings awaiting developer clarification. Use OBS-XXX IDs.

**7. Automation Strategy**
Will be written by human as part of the HOTL strategy

**8. CI/CD Data Handling Strategy**
Will be written by human as part of the HOTL strategy

**9. Summary Table**
Quick-reference table of all bug IDs, titles, severities, and root cause groups.

**10. AI vs Human Comparison Table**
Side-by-side table of all findings with Human ✅ / AI ✅ / Both attribution, and a note explaining what each side contributed. Include totals at the bottom broken down by: Human only / AI only / Both / Combined total.

**11. Testing Methodology Summary**
Will be written by human as part of the HOTL strategy

---

## Behaviour Instructions

- Do not ask clarifying questions. Start the report immediately.
- If any finding is ambiguous, make a reasonable assumption and note it inline.
- Where a finding has both a human-observed symptom and an AI-discovered root cause, document both layers under the same BUG ID.
- Where two IDs turn out to be the same bug, consolidate them and note the duplicate.

**Infrastructure / API failures — apply this rule before classifying:**
API errors (CORS 403, DNS failure, HTTP 403) observed in a staging or personal-branch environment may be environment-configuration artefacts rather than genuine code defects. Before assigning Critical or High severity, ask: could this be caused by the staging domain not being on the CORS allow-list, a decommissioned sandbox API Gateway, or an endpoint that requires auth credentials the frontend is not sending? If yes, keep the bug in the report at its observed severity but append a `⚠️ TO DISCUSS WITH DEVELOPERS` note explaining the ambiguity. The silent error-handling pattern (empty `catch` blocks, swallowed failures) is always a confirmed bug regardless of whether the underlying 403 is intentional.

**Bug vs Observation — apply this rule before filing:**
If the server validates correctly and the client-side behaviour that looks suspicious is actually correct architecture (e.g. a disabled button that the server would reject anyway), file it as an Observation, not a bug. Client-side UX controls are not security controls; server-side validation is the real safety net. Do not raise a bug for behaviour that is working as designed at the system level.

**Severity definitions:**
  - **P0 / Critical Security** — active data exposure, GDPR violation, credentials leaked
  - **Critical** — feature completely broken or compliance gate non-functional
  - **High** — significant user impact, automation blocker, security risk
  - **Medium** — degraded experience, silent failure, misleading UX
  - **Low** — cosmetic, copy error, minor inconsistency
  - **Observation / Info** — behaviour worth noting, not necessarily a bug
