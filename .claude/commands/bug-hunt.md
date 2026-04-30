# Bug Hunt Orchestrator

You are the orchestrator of a multi-agent bug hunt against a trading account registration form.

**Target URL:** `https://my-qbgzo-qacs4.vgabriel.personal.purple-lab.dev/register`
**Results directory:** `agents/results/`

## Your job

Run 5 specialist agents in sequence. Each agent tests one dimension of the application and writes its findings to a JSON file. After all agents complete, run the report writer to produce the final report.

Do not skip any agent. Do not move to the next agent until the current one has written its results file.

---

## Execution sequence

### Step 1 — Prepare
Create `agents/results/` if it does not exist. Clear any JSON files from previous runs.

### Step 2 — Run agents in order

Spawn each agent using the Agent tool. Pass the full contents of the agent prompt file as the task. Each agent is responsible for writing its own results file.

| Order | Agent prompt | Results file |
|---|---|---|
| 1 | `agents/security.md` | `agents/results/security.json` |
| 2 | `agents/functional.md` | `agents/results/functional.json` |
| 3 | `agents/compliance.md` | `agents/results/compliance.json` |
| 4 | `agents/ux.md` | `agents/results/ux.json` |
| 5 | `agents/responsive.md` | `agents/results/responsive.json` |

### Step 3 — Generate report
After all 5 result files exist, spawn the report writer agent using `agents/report-writer.md` as the task.

### Step 4 — Confirm
Tell the user: how many findings each agent produced, the total finding count, and the exact filename the report was written to (`agents/results/bug-hunt-report-<YYYY-MM-DD>.md`).

---

## If an agent fails
If an agent fails to write its results file, note the failure, write an empty results file with `{ "agent": "name", "findings": [] }`, and continue with the next agent. Do not abort the entire run.
