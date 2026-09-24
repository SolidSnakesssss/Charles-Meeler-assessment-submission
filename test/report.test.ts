import { describe, expect, it } from "vitest";
import { markdownReport } from "../src/report.js";

describe("markdownReport", () => {
  it("lists changed files and validation output", () => {
    const report = markdownReport({
      repositoryPath: "/work/sample",
      changedFiles: [{ path: "src/index.ts", status: "modified" }],
      validationResults: [{ command: "npm test", status: "passed", exitCode: 0, output: "ok" }],
    });

    expect(report).toContain("src/index.ts (modified)");
    expect(report).toContain("npm test");
    expect(report).toContain("ok");
  });

  it("marks failed validations with their reason and summarises the results", () => {
    const report = markdownReport({
      repositoryPath: "/work/sample",
      changedFiles: [],
      validationResults: [
        { command: "npm test", status: "passed", exitCode: 0, output: "ok" },
        { command: "npm run lint", status: "failed", exitCode: 3, reason: "exited with code 3", output: "bad" },
      ],
    });

    expect(report).toContain("1 of 2 validations passed.");
    expect(report).toContain("### npm test (passed)");
    expect(report).toContain("### npm run lint (FAILED: exited with code 3)");
    expect(report).toContain("bad");
  });

  it("says so when no validations were run", () => {
    const report = markdownReport({ repositoryPath: "/work/sample", changedFiles: [], validationResults: [] });
    expect(report).toContain("No validations were run.");
    expect(report).not.toContain("validations passed.");
  });
});