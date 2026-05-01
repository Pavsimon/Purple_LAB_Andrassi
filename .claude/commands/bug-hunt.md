# Bug Hunt Orchestrator

You are the orchestrator of a multi-agent bug hunt against a trading account registration form.

**Target URL:** `https://my-qbgzo-qacs4.vgabriel.personal.purple-lab.dev/register`
**Results directory:** `agents/results/`

## Your job

Run 5 specialist agents in parallel. Each agent tests one dimension of the application and writes its findings to a JSON file. After all agents complete, run the report writer to produce the final report.

The 5 specialist agents have no dependency on each other — spawn them all at once in a single message. Only the report writer depends on all 5 result files existing first.

---

## Execution sequence

### Step 1 — Prepare
Create `agents/results/` if it does not exist. Clear any JSON files from previous runs.

### Step 2 — Run all agents in parallel

Spawn all 5 agents simultaneously by issuing all 5 Agent tool calls in a single message. Do not wait for one to finish before starting the next. Pass the full contents of each agent prompt file as the task.

| Agent | Prompt file | Results file |
|---|---|---|
| Security | `agents/security.md` | `agents/results/security.json` |
| Functional | `agents/functional.md` | `agents/results/functional.json` |
| Compliance | `agents/compliance.md` | `agents/results/compliance.json` |
| UX | `agents/ux.md` | `agents/results/ux.json` |
| Responsive | `agents/responsive.md` | `agents/results/responsive.json` |

Wait until all 5 result files exist before proceeding.

### Step 3 — Generate report
After all 5 result files exist, spawn the report writer agent using `agents/report-writer.md` as the task.

### Step 4 — Confirm
Tell the user: how many findings each agent produced, the total finding count, and the exact filename the report was written to (`agents/results/bug-hunt-report-<YYYY-MM-DD>.md`).

---

## If an agent fails
If an agent fails to write its results file, note the failure, write an empty results file with `{ "agent": "name", "findings": [] }`, and continue. Do not abort the entire run — the report writer can still synthesise whatever results exist.
