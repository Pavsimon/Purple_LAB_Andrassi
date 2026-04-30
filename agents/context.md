# Shared Agent Context

All bug hunt agents share the following configuration. Read this file before running your tests.

---

## Target

**URL:** `https://my-qbgzo-qacs4.vgabriel.personal.purple-lab.dev/register`

This is a trading account registration form running on a live staging environment. Black-box testing only — no access to source code or backend.

---

## Tooling

Use `mcp__plugin_playwright_playwright__*` tools for all browser interaction.

---

## Output schema

Each agent writes a single JSON file to `agents/results/<agent-name>.json`. Use exactly this structure:

```json
{
  "agent": "<agent-name>",
  "timestamp": "<ISO 8601 timestamp>",
  "url": "https://my-qbgzo-qacs4.vgabriel.personal.purple-lab.dev/register",
  "findings": [
    {
      "severity": "P0 | Critical | High | Medium | Low | Observation",
      "title": "Short description of the issue",
      "element": "Affected field, element, or endpoint",
      "steps": ["Step 1", "Step 2"],
      "expected": "What should happen",
      "actual": "What actually happens",
      "evidence": "Exact console output, URL, visible text, or description of what was observed"
    }
  ]
}
```

An empty `findings` array is a valid result. Only add a finding for broken or unexpected behaviour.

---

## Severity definitions

| Severity | When to use |
|---|---|
| **P0** | Active data exposure, credentials leaked, GDPR violation |
| **Critical** | Feature completely broken or compliance gate non-functional |
| **High** | Significant user impact, regulatory risk, or broken legal link |
| **Medium** | Degraded experience, silent failure, misleading UX |
| **Low** | Cosmetic issue, copy error, minor inconsistency |
| **Observation** | Behaviour worth noting — not confirmed as a bug |

---

## Closing instruction

Write your results file when done. Do not summarise — just write the file.
