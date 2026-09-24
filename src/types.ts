export type ChangedFile = {
  path: string;
  status: "added" | "modified" | "deleted" | "untracked";
};

export type ValidationResult = {
  command: string;
  status: "passed" | "failed";
  /** Null when the process did not exit on its own (timed out, output limit, could not start). */
  exitCode: number | null;
  /** Why the command failed, e.g. "exited with code 3" or "timed out after 300s". */
  reason?: string;
  output: string;
};

export type ReviewRequest = {
  repositoryPath: string;
  baseRef?: string;
  validationCommands?: string[];
  format?: "markdown" | "json";
};