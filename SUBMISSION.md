# Submission

Known Issues:
Critical:
2. Any caller can run arbitrary shell commands through MCP (safety issue)
4. baseRef can inject Fit options (safety issue)

## What did you investigate first, and why?
I decided to first investigate the failing validation in validation.ts. Since the validation fails, there is no report generated. runValidation call reject(error) whenever the shell command fails rather than resolving with a "failed" status. 

## What did you choose to implement or fix?
1. validation.ts failing by throw errors when a command fails. Now produces a "failed" status and generates reports
2. MCP ignoring repo_path and reviewing the wrong repo. Corrected this by fixing the field from repoPath to repo_path, returning an error if a unexpected field is sent or is mispelled, checks that the path is valid, and then return clean if Git fails due to errors like the branch name not existing. 
3. 

## What did you intentionally not do?
I decided not to work on the shell command issue with MCP. I believed it was important that MCP actually uses the correct repo_path first and that the CLI will generate a report since this is a crucial feature. 

## Interface decision

- Decision: CLI-first / MCP-first / hybrid

The production interface should be hybrid with a primary focus on CLI and secondary focus on a strict MCP. The CLI is how people people directly controls what is being ran. MCP serves AI agents which may rely on this project, but cannot be be trusted on the same level as humans. 

- Primary user and execution environment:
The primary user would be a human running CLI.

- Trust boundary and allowed capabilities:
- Reliability, discoverability, latency/context, and output tradeoffs:
- How supported interfaces remain consistent:
- Evidence that would change this decision:

## How did you use an AI coding agent?


## Where did you check, correct, or reject an AI suggestion? (required)
1. While I was working with the AI to fix the MCP issues, it kept hallucinating that the README explicitly required specific changes to the MCP. I checked the README and found no such mention of any specified issues. I then corrected the AI.

## Commands used to verify the result, with outcomes
Mostly used:
1. npm run typecheck
2. npm tests

I checked the tests the AI ran to ensure the tests would work. Then I ran them. In the case of the changes for the validation issue for CLI, a report is now generated. 

## A blocker you hit and how you approached it

## Known limitations and the next three things you would do



## Approximate focused-work time

- Start: September 23 2026 | 8:30 pm
- Finish: