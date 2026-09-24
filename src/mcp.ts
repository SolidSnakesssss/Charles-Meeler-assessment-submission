import { statSync } from "node:fs";
import { isAbsolute } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { reviewRepository } from "./core.js";

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

// Relative paths would resolve against the server's own working directory,
// which the client does not control, so only absolute directories are accepted.
function checkRepositoryPath(repoPath: string): string | undefined {
  if (!isAbsolute(repoPath)) {
    return `repo_path must be an absolute path, received "${repoPath}".`;
  }
  try {
    if (!statSync(repoPath).isDirectory()) {
      return `repo_path is not a directory: ${repoPath}`;
    }
  } catch {
    return `repo_path does not exist: ${repoPath}`;
  }
  return undefined;
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "repository-inspector", version: "2.0.0" });

  server.registerTool(
    "review_repository",
    {
      description: "Inspects a Git repository and returns a review report.",
      // A full strict schema, not a raw shape: the SDK wraps raw shapes in a
      // non-strict object that silently drops unknown fields.
      inputSchema: z
        .object({
          repo_path: z.string().min(1).describe("Absolute path to the Git repository to inspect."),
          baseRef: z.string().optional().describe('Git ref to diff against. Defaults to "main".'),
          validationCommands: z
            .array(z.string())
            .optional()
            .describe("Shell commands to run in the repository, in order."),
        })
        .strict(),
    },
    async ({ repo_path, baseRef, validationCommands }) => {
      const pathError = checkRepositoryPath(repo_path);
      if (pathError) {
        return errorResult(pathError);
      }
      try {
        const report = await reviewRepository({ repositoryPath: repo_path, baseRef, validationCommands });
        return { content: [{ type: "text", text: report }] };
      } catch (error) {
        return errorResult(`Review failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  );

  return server;
}
