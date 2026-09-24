# Submission

Known Issues:
Critical:
2. Any caller can run arbitrary shell commands through MCP (safety issue)
4. baseRef can inject Fit options (safety issue)

## What did you investigate first, and why?
I decided to first investigate the failing validation in validation.ts. Since the validation fails, there is no report generated. runValidation call reject(error) whenever the shell command fails rather than resolving with a "failed" status. I felt that it was critical for this system to work. 

## What did you choose to implement or fix?
1. validation.ts failing by throw errors when a command fails. Since the CLI is the primary focus of the hybrid, I wanted to ensure that a report is successfully generated so the user understands why a command failed. 

2. MCP ignoring repo_path and reviewing the wrong repo. Corrected this by fixing the field from repoPath to repo_path, returning an error if a unexpected field is sent or is mispelled, checks that the path is valid, and then return clean if Git fails due to errors like the branch name not existing. 

## What did you intentionally not do?
I decided not to work on the shell command issue with MCP. I believed it was important that MCP actually uses the correct repo_path first and that the CLI will generate a report since this is a crucial feature. 

## Interface decision

- Decision: CLI-first / MCP-first / hybrid

The production interface should be hybrid with a primary focus on CLI and secondary focus on a strict MCP. The CLI is how people people directly controls what is being ran. MCP serves AI agents which may rely on this project, but cannot be be trusted on the same level as humans. 

- Primary user and execution environment:
The primary user would be a human running CLI.

- Trust boundary and allowed capabilities:
CLI assumes that the user has control and responsibility over their repo.

MCP cannot be afforted the same trust since they are automated. I fixed MCP to only validate repo_path though I had to pass on implementing restricted valdiation commands.

- Reliability, discoverability, latency/context, and output tradeoffs:
CLI gives users direct feedback in the form of error codes and report making it very reliable to use. Since the user directly talks to the repository through the command line, there is essentially no latency. The potential tradeoff is the manual input of commands which could result in failure due to small issues like typos.

MCP are less predictable than a human user. Ai agents are called to decided how to send commands rather than a human directly. Correctness would depend on the agent being used. The tradeoff of this is that all commands are automated for the user meaning the human does not have to do anything but give commands and approve. 


- How supported interfaces remain consistent:
CLI and MCp use the same reviewRepository function in core.ts. This means that most of the processes remain the same between the two. Git step, validation, and report are handled the same way. 

- Evidence that would change this decision:
1. If most people use AI then the focus would primarily be on fixing and improving the MCP.
2. MCP reliabely support asking the user to confirm each command making MCP more trustworthy

## How did you use an AI coding agent?
I used Claude Code to investigate the code and implement both fixes and tests. I made sure that claude first proposed changes allowing for me to review potential changes before approval. 

## Where did you check, correct, or reject an AI suggestion? (required)
1. While I was working with the AI to fix the MCP issues, it kept hallucinating that the README explicitly required specific changes to the MCP. I checked the README and found no such mention of any specified issues. I then corrected the AI.

## Commands used to verify the result, with outcomes
Mostly used:
1. npm run typecheck
2. npm test

I checked the tests the AI ran to ensure the tests would work. Then I ran them. In the case of the changes for the validation issue for CLI, a report is now generated. 

## A blocker you hit and how you approached it
A significant blocker for my was that this stack was based on a lot of new concepts for me. I have not worked with TypeScript and MCP. I addressed this issue by leaning on Claude Code to help me investigate the code (such as MCP SDK's schema and tool registration patterns) and explan typescript syntax. I wanted to make sure I could understand enough to verify each fix. 

## Known limitations and the next three things you would do
There are still a lot of issues left that I could not address:

1. A report is still not generated when Git step fails. 
2. MCP callers can run any shell command which is still a serious issue i decided to pass for time. 
3. baseRef can inject Git options which can be done by both the CLI and MCP
4. Tests have partial coverage. Cannot fully verify validaiton, report, and MCP

Three things I would do:
1. Create Allowlist validation commands in MCP to ensure the server only runs valid commands the AI sends. This would potentially reject any unknown names
2. Fix the baseRef injection by rejecting anytime the baseRef starts with "-" and checking that the ref exists
3. Make CLI exist with any non-zero code if validation fails so CI and/or AI agents can tell that tests failed wiithout reading the report


## Approximate focused-work time

- Start: September 23 2026 | 8:30 pm
- Finish: September 23 2026 | 10:00 pm (pushed after are me filling out the submission)

- Finished SUBMISSION.md by 10:30 pm