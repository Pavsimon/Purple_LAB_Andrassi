# Project Reflection: How This Was Built

## I thought this would take a day

When I first read the brief I scanned it, thought "registration form, a few bugs, some test cases" and estimated a one MD. That was wrong in a way that's useful to document.
I would say it took two MD...

The compliance layer alone took longer than I expected the whole project to take. Understanding why a FATF blacklisted country should be blocked, what the EU/EEA restriction actually means for a trading product, which legal entity applies under which jurisdiction, and how any of that should surface in a UI: that's not surface-level work. I gave it the time it needed but I'll be honest, I only scratched the surface. A deeper understanding of that domain would have changed several test scenarios and sharpened the severity ratings on a few bugs.

The form itself had more intentionally broken things than I expected. That made it interesting. It also made it slower.

## The battle plan phase

Before touching the page I went through all four tasks and figured out the order. This is where I first used AI, not to test anything, just to sense-check the sequencing. The output matched what I was thinking, which was reassuring, but the more useful part was pressure-testing my assumptions early rather than discovering a structural problem halfway through.

Then I read the page. Not tested, read. Legal notices, entity names, country logic, what the notices were actually claiming. I treated it as a product I needed to understand before I could have an opinion about whether it was working correctly.

## Manual first, deliberately

I tested the form myself before giving anything to AI. That was a decision, not an accident. The things manual testing finds that AI does not are specific: the Switzerland modal loop that fires 16 alert dialogs required a human to click through a specific country sequence and sit there while it happened. The Corporate tab silent failure needed someone to actually press the button and notice nothing occurred. The T&C link looking visually indistinguishable from plain text is a trust signal judgment, not a DOM attribute.

The numbers from the report tell the story cleanly. Human only: 9 bugs. AI only: 7. Both independently: 19. The overlap was the validation. The exclusive findings on each side were the argument for doing both.

## The prompt I used to run AI through the same page

After manual testing I ran AI through the same page using a structured prompt. The full prompt is in `PROMPT.md`. The structure took time to build: role definition, seven testing dimensions, attribution rules for Human / AI / Both, severity definitions, and a specific instruction for handling infrastructure failures in staging environments.

That last part mattered. Three API endpoints returned 403 on page load. A naive severity assignment would call all of them Critical. The correct call was: these might be environment configuration issues, not code defects, flag them for developer discussion rather than filing them as confirmed blockers. Building that judgment into the prompt meant the output was usable rather than requiring manual cleanup.

What AI found that I had missed: the page title contained the placeholder text "blablabla" in production. The third benefit tile heading read "High Quality Customer Sport" instead of "Support". The ipstack API key was exposed in plain text in a GET request URL. And the first and last name fields had their `data-testid` and `name` attributes swapped, meaning every form submission inverts the user's name. That last one is a Critical data integrity failure I did not catch manually.

## Automation: Gherkin from zero

I had no prior experience with Gherkin before this project. I studied it, wrote a few scenarios by hand, then built a project-specific skill with the conventions baked in: when to use Background, how to write assertions, the difference between a Scenario and a Scenario Outline. The skill reviewed my manual scenarios and fixed them. I used it to co-write the rest.

The specs deliberately include failing tests. That was intentional. The T&C checkbox cannot be checked through normal user interaction, so the happy path test cannot complete. I tagged it `@known-bug`, documented the bug ID in the test, and left it failing. Submitting a test suite where known failures are hidden felt like the wrong demonstration. Submitting one where they are visible and explained felt like the right one.

I wanted to test the API layer, specifically creating a user via POST and validating the response. I could not get through the form to trigger a submission, which made proper API integration testing impractical without mocking. I chose not to mock. The form is the system under test and mocking the submission would have been testing my mock, not the product.

## The pipeline I added at the end

After writing the automation vision section I realised I had described an agentic approach without actually demonstrating one in the project. So I went back and built it.

Five specialist agents running in sequence: security, functional, compliance, UX, responsive. Each writes structured JSON findings. A sixth agent reads all outputs, deduplicates, assigns severity and bug IDs, and produces a dated report. The full pipeline is triggered with a single command.

It works. It also runs slowly, consumes a significant number of tokens, and does not run in CI. I had to stop it mid-execution during testing because it was hitting usage limits. The agents found the same issues already documented in the manual report, which confirmed the findings but did not produce anything new.

I am slightly annoyed I did not build it at the start of the process rather than the end. That is also noted in the automation vision document, honestly.

## What I would do with more time

The honest answer is not "more of everything." It is specific things that would have changed the quality of the work, not just the volume of it.

The biggest gap is that I never submitted the form. The T&C checkbox cannot be checked through normal interaction, which means the happy path test cannot complete, no real POST request was ever observed, and I do not know what a successful registration actually looks like on the other side. With more time I would have tried to find any combination that allows a real submission — force-checking via JavaScript, intercepting the network layer directly, or testing against a different environment if one was available. Understanding the full flow from submission to confirmation is the most important thing missing from this work.

The compliance and legal layer is the second gap. I understood enough to identify that the EU/EEA blocking is informational only and that FATF blacklisted countries are not restricted. But I did not understand the business consequence of those failures at the level I would want to. Knowing what the actual regulatory exposure is, what the Axiory Global versus Tradit Ltd entity split means in practice, and whether the country notice content is legally accurate rather than just technically present — that context would have changed how I framed several findings and probably surfaced issues I did not know to look for.

The agentic pipeline would have been built at the start, not added at the end. Running it in CI on every deploy, with cost controls and parallel execution, is the version that actually demonstrates the concept rather than just proves it can work once.

Everything else — more scenarios, more viewports, more test files — is volume. The missing submission flow and the shallow compliance understanding are the actual gaps. More coverage without fixing those would just be more tests around a hole.

## On AI collaboration overall

The pattern across the whole project was: I consulted AI, I reviewed what came back, I made a decision, I moved forward. That was true for the battle plan, the prompt structure, the Gherkin scenarios, the spec implementation, the agent pipeline.

I did not use anything I could not explain. That is not a philosophical position, it is a practical one. Code I cannot explain is code I cannot debug, defend, or extend. The point of the collaboration was to go faster while staying in control of the direction, not to hand over the wheel and see where it ended up.

The things AI accelerated most: writing the structured prompt, scaffolding the test specs, building the agent pipeline. The things I had to own entirely: deciding what to test, why it mattered, what the compliance implications were, and what to do about bugs that might be environment issues rather than code defects. That split felt right.

I do not know what the next few months will look like for this kind of work. The tooling is changing fast enough that a specific workflow recommendation from six months ago is already partly obsolete. What I do know is that the engineers who understand how to work with agents, not just use them, will be in a better position than those who do not. I am somewhere in the middle of learning that myself. This project was part of that process.

## Prompts used in this project

All prompts are version-controlled in the repository. This section maps each one to where it lives and what it was used for.

| Prompt | Location | What it does |
|---|---|---|
| Bug hunting | `PROMPT.md` | The main structured prompt used to run AI through the registration form. Defines role, seven testing dimensions, Human / AI / Both attribution rules, severity definitions, and a specific instruction for handling ambiguous infrastructure failures in staging environments. |
| Gherkin skill | `.claude/commands/gherkin.md` | Project-specific BDD writing assistant. Encodes Gherkin conventions, project field names, planned feature file structure, and the tag taxonomy. Used to review manually written scenarios and co-write the rest. |
| Test builder skill | `.claude/commands/test_builder.md` | Spec scaffolding guide. Covers how tests are structured in this project: fixture usage, locator strategy, POM method patterns, data-driven approaches, and race condition handling. |
| Bug hunt orchestrator | `.claude/commands/bug-hunt.md` | Triggers the five-agent pipeline. Defines agent execution order, result file locations, failure handling, and report generation. |
| Shared agent context | `agents/context.md` | Single source of truth shared across all five specialist agents: target URL, output JSON schema, severity definitions, tooling instruction. |
| Security agent | `agents/security.md` | Specialist prompt scoped to password exposure, network request inspection, field masking, and console error analysis. |
| Functional agent | `agents/functional.md` | Specialist prompt scoped to field validation, submit button state, T&C checkbox interaction, and country selection behaviour. |
| Compliance agent | `agents/compliance.md` | Specialist prompt scoped to EU/EEA blocking, FATF blacklist countries, notice accuracy, and T&C link destinations. |
| UX agent | `agents/ux.md` | Specialist prompt scoped to copy errors, placeholder content, broken links, label quality, and tab behaviour. |
| Responsive agent | `agents/responsive.md` | Specialist prompt scoped to layout correctness at five viewport widths: 375px, 440px, 785px, 900px, 1280px. |
| Report writer agent | `agents/report-writer.md` | Reads all five JSON result files, deduplicates findings across agents, assigns sequential BUG-IDs by severity, and writes a dated markdown report. |
