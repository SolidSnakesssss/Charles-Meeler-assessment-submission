import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { runValidation, runValidations } from "../src/validation.js";

const cwd = mkdtempSync(join(tmpdir(), "inspector-validation-"));

// Commands use `node -e` so they behave the same under cmd.exe and /bin/sh.
const node = (script: string) => `node -e "${script}"`;

afterAll(() => rmSync(cwd, { recursive: true, force: true }));

describe("runValidation", () => {
  it("reports a zero exit as passed", async () => {
    const result = await runValidation(node("console.log('ok')"), cwd);
    expect(result).toMatchObject({ status: "passed", exitCode: 0 });
    expect(result.reason).toBeUndefined();
    expect(result.output).toContain("ok");
  });

  it("reports a non-zero exit as failed without throwing, keeping its output", async () => {
    const result = await runValidation(node("console.log('partial'); process.exit(3)"), cwd);
    expect(result).toMatchObject({ status: "failed", exitCode: 3, reason: "exited with code 3" });
    expect(result.output).toContain("partial");
  });

  it("keeps stderr when there is also stdout", async () => {
    const result = await runValidation(node("console.log('out'); console.error('err')"), cwd);
    expect(result.status).toBe("passed");
    expect(result.output).toContain("out");
    expect(result.output).toContain("err");
  });

  it("returns stderr alone when there is no stdout", async () => {
    const result = await runValidation(node("console.error('only err'); process.exit(1)"), cwd);
    expect(result.status).toBe("failed");
    expect(result.output).toContain("only err");
    expect(result.output).not.toContain("--- stderr ---");
  });

  it("fails a command whose output exceeds the 10 MB limit", async () => {
    const result = await runValidation(node("process.stdout.write('x'.repeat(11 * 1024 * 1024))"), cwd);
    expect(result).toMatchObject({ status: "failed", exitCode: null, reason: "output exceeded 10 MB" });
  });

  it("fails when the working directory does not exist", async () => {
    const result = await runValidation(node("console.log('ok')"), join(cwd, "missing"));
    expect(result.status).toBe("failed");
    expect(result.exitCode).toBeNull();
    expect(result.reason).toMatch(/^could not run: /);
  });
});

describe("runValidations", () => {
  it("runs every command in order even after a failure", async () => {
    const results = await runValidations(
      [node("console.log('one')"), node("process.exit(2)"), node("console.log('three')")],
      cwd,
    );
    expect(results.map((result) => result.status)).toEqual(["passed", "failed", "passed"]);
    expect(results[1].exitCode).toBe(2);
    expect(results[2].output).toContain("three");
  });

  it("returns no results when there are no commands", async () => {
    expect(await runValidations([], cwd)).toEqual([]);
  });
});
