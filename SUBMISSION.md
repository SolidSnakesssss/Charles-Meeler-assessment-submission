# Submission

Known Issues:
Critical:
1. MCP ignores repo_path
2. Any caller can run arbitrary shell commands through MCP (safety issue)
3. Failed validation discards the entire review
4. baseRef can inject Fit options (safety issue)

## What did you investigate first, and why?
I decided to first investigate the failing validation in validation.ts. Since the validation fails, there is no report generated. runValidation call reject(error) whenever the shell command fails rather than resolving with a "failed" status. 

## What did you choose to implement or fix?
1. 

## What did you intentionally not do?

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


## Commands used to verify the result, with outcomes

## A blocker you hit and how you approached it

## Known limitations and the next three things you would do

## Approximate focused-work time

- Start: September 23 2026 | 8:30 pm
- Finish: