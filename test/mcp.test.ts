import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../src/mcp.js";

type ToolResult = { isError?: boolean; content: { type: string; text: string }[] };

let repo: string;
let client: Client;

function git(...args: string[]) {
  execFileSync("git", args, { cwd: repo, stdio: "ignore" });
}

async function review(args: Record<string, unknown>): Promise<ToolResult> {
  return (await client.callTool({ name: "review_repository", arguments: args })) as ToolResult;
}

beforeAll(async () => {
  // A repo whose only change on `feature` is a file that exists nowhere else,
  // so its presence in a report proves this repo was the one reviewed.
  repo = mkdtempSync(join(tmpdir(), "inspector-mcp-"));
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "Test");
  writeFileSync(join(repo, "base.txt"), "base\n");
  git("add", ".");
  git("commit", "-q", "-m", "base");
  git("checkout", "-q", "-b", "feature");
  writeFileSync(join(repo, "feature-only.txt"), "feature\n");
  git("add", ".");
  git("commit", "-q", "-m", "feature");

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createServer().connect(serverTransport);
  client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientTransport);
});

afterAll(async () => {
  await client?.close();
  rmSync(repo, { recursive: true, force: true });
});

describe("review_repository", () => {
  it("advertises repo_path as the only required input", async () => {
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === "review_repository");
    expect(tool?.inputSchema.required).toEqual(["repo_path"]);
  });

  it("reviews the repository named by repo_path", async () => {
    const result = await review({ repo_path: repo });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain(`# Review Report: ${repo}`);
    expect(result.content[0].text).toContain("feature-only.txt (added)");
  });

  it("runs validation commands inside repo_path", async () => {
    const result = await review({
      repo_path: repo,
      validationCommands: [`node -e "console.log(require('fs').existsSync('feature-only.txt'))"`],
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toMatch(/```\ntrue\n/);
  });

  it("returns a failed validation as a normal report, not a tool error", async () => {
    const result = await review({ repo_path: repo, validationCommands: [`node -e "process.exit(3)"`] });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("FAILED: exited with code 3");
  });

  it("rejects a relative repo_path", async () => {
    const result = await review({ repo_path: "some/relative/path" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("must be an absolute path");
  });

  it("rejects a repo_path that does not exist", async () => {
    const result = await review({ repo_path: join(repo, "missing") });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("does not exist");
  });

  it("rejects a repo_path that is a file", async () => {
    const result = await review({ repo_path: join(repo, "base.txt") });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("is not a directory");
  });

  it("rejects unknown fields instead of silently dropping them", async () => {
    const result = await review({ repo_path: repo, repoPath: repo });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("repoPath");
  });

  it("rejects a call without repo_path", async () => {
    const result = await review({ repoPath: repo });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("repo_path");
  });

  it("reports git failures as a tool error instead of crashing", async () => {
    const result = await review({ repo_path: repo, baseRef: "no-such-branch" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/^Review failed: /);
  });
});
