import { exec, type ExecException } from "node:child_process";
import type { ValidationResult } from "./types.js";

const TIMEOUT_MS = 5 * 60 * 1000;
const MAX_OUTPUT_BYTES = 10 * 1024 * 1024;

function combineOutput(stdout: string, stderr: string): string {
  if (stdout && stderr) {
    return `${stdout.trimEnd()}\n--- stderr ---\n${stderr}`;
  }
  return stdout || stderr;
}

function describeFailure(error: ExecException): { exitCode: number | null; reason: string } {
  // @types/node declares `code` as a number, but Node sets string codes such as
  // "ENOENT" or "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" when the child never exited normally.
  const code: unknown = error.code;
  if (error.killed) {
    return { exitCode: null, reason: `timed out after ${TIMEOUT_MS / 1000}s` };
  }
  if (typeof code === "number") {
    return { exitCode: code, reason: `exited with code ${code}` };
  }
  if (code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
    return { exitCode: null, reason: `output exceeded ${MAX_OUTPUT_BYTES / 1024 / 1024} MB` };
  }
  if (error.signal) {
    return { exitCode: null, reason: `terminated by ${error.signal}` };
  }
  return { exitCode: null, reason: `could not run: ${error.message}` };
}

export function runValidation(command: string, cwd: string): Promise<ValidationResult> {
  return new Promise((resolve) => {
    exec(command, { cwd, timeout: TIMEOUT_MS, maxBuffer: MAX_OUTPUT_BYTES }, (error, stdout, stderr) => {
      const output = combineOutput(stdout, stderr);
      if (error) {
        resolve({ command, status: "failed", ...describeFailure(error), output });
      } else {
        resolve({ command, status: "passed", exitCode: 0, output });
      }
    });
  });
}

export async function runValidations(commands: string[], cwd: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  for (const command of commands) {
    results.push(await runValidation(command, cwd));
  }
  return results;
}
