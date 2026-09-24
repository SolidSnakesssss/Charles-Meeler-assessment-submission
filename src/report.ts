import type { ChangedFile, ValidationResult } from "./types.js";

type ReportInput = {
  repositoryPath: string;
  changedFiles: ChangedFile[];
  validationResults: ValidationResult[];
};

export function markdownReport(input: ReportInput): string {
  const lines = [`# Review Report: ${input.repositoryPath}`, "", "## Changed files"];
  for (const file of input.changedFiles) {
    lines.push(`- ${file.path} (${file.status})`);
  }
  lines.push("", "## Validation output");
  if (input.validationResults.length === 0) {
    lines.push("No validations were run.");
  } else {
    const passed = input.validationResults.filter((result) => result.status === "passed").length;
    lines.push(`${passed} of ${input.validationResults.length} validations passed.`, "");
  }
  for (const result of input.validationResults) {
    const status = result.status === "passed" ? "passed" : `FAILED: ${result.reason}`;
    lines.push(`### ${result.command} (${status})`, "```", result.output, "```");
  }
  return lines.join("\n");
}