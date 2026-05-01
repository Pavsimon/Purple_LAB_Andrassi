# The QA Engineer in the Agentic Era

## What's actually happening

AI agents are taking the repetitive work. Not threatening to, doing it. Regression suites, script generation, basic defect triage: a well-prompted agent handles these faster and without the context-switching overhead that makes the third hour of regression testing actively bad for human cognition. This is not a future state to prepare for. It's the current state to accept.

What follows from acceptance is a question: if the agent runs the regression, what does the engineer do?

## The split I found in practice

I've been building an agentic pipeline for QA as part of this project, a multi-agent bug hunt that runs five specialist agents in parallel and synthesises findings into a structured report. The pipeline works. It finds real defects: passwords logged to the browser console on every keystroke, legal documents pointing to meme images, a form that can never be submitted. What it doesn't do is understand why any of that matters.

It doesn't know that a broken T&C link in a regulated trading product isn't a Medium UX issue, it's a compliance exposure. It doesn't know that a form you can't submit is a complete revenue block, not a functional bug. It found the evidence. I had to bring the business context.

That's the split. The agent runs the test. The human decides what the finding means.

## The QA engineer becomes the orchestrator

Not the person who writes the test. The person who designs the system that writes the test, runs it, interprets it, and routes the finding to the right stakeholder with the right framing.

That requires a different skill set than scripting. It requires knowing enough about agents and prompting to configure them well. A poorly specified agent prompt produces findings you can't trust. A well-specified one produces findings you can present to a product manager without cleanup. It requires understanding what AI reliably gets wrong: hallucinated severity, edge cases that need human imagination, no sense of emotional friction in a user flow. And it requires translating technical findings into business language, which has always been undervalued in QA and is now the core of the job.

The shift is from execution to judgment.

## What to do today, practically

Start with prompting. Not as a curiosity, as a technical skill that directly determines your agent's output quality. Then learn how agents chain: what a well-scoped agent does, where handoffs break, how to validate output before it becomes a decision. You don't need to build orchestration frameworks from scratch. You need to understand the principles well enough to design workflows and catch failures.

The engineers who figure this out first won't be replaced. They'll be the ones designing the systems that replace the work.

## What the agents can't take

AI can tell you the button doesn't work. It can't tell you the interaction feels condescending.

It can flag that an error message is technically correct. It can't tell you that "Invalid input" on a financial form erodes trust in a way that accumulates across a session.

It can reproduce a defect. It can't sit in a user interview and notice that someone hesitated before clicking something they successfully completed.

The irreducible human contribution is exactly where QA has always underperformed: judgment about how software makes people feel, and whether that feeling maps to what the business is trying to achieve. That's not soft work. It's the hardest work on the team.

It's just finally the one the agents can't take.

## Where I actually am

I want to be honest about this. The agentic pipeline I built for this project is a proof of concept, not a production system. It runs slowly. It consumes a significant amount of tokens. It doesn't run in CI. I had to stop it mid-execution during the demo because it was hitting usage limits.

That's fine for a demonstration of the concept, but it also means I'm somewhere in the middle of this transition myself, not at the end of it. I know how to design agent workflows and I understand the principles. The operational side, cost efficiency, CI integration, reliability at scale, is still work I need to do.

I don't think that's unusual. I think that's where most of the industry is right now. Nobody has this fully figured out. The tools are changing fast enough that something written about agentic testing six months ago is already partly obsolete. I can't tell you what the next few months will bring because software development is shifting fast enough that confident predictions mostly just reveal how little the predictor is actually watching.

What I can say is that waiting to start learning is the wrong move. The gap between people who understand how to work with agents and people who don't is already noticeable. It's going to get wider.
