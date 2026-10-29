import { expect, mock, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import ompExtension, { integrationDirectory } from "../omp-extension/index.ts";

mock.module("@oh-my-pi/pi-coding-agent", () => ({ VERSION: "18.11.3-rc.1" }));

test("native lifecycle events publish running and idle schema-1 snapshots", async () => {
  const previousInstanceId = process.env.AOE_INSTANCE_ID;
  const previousPane = process.env.TMUX_PANE;
  const instanceId = `native-status-${process.pid}-${randomUUID()}`;
  const reportPath = path.join(integrationDirectory(process.getuid(), instanceId), "integration-omp.agent-of-empires.json");
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  const pi = {
    on(event: string, handler: unknown) {
      if (typeof handler === "function") handlers.set(event, handler as (...args: unknown[]) => unknown);
    },
  } as unknown as Parameters<typeof ompExtension>[0];
  type StatusReport = {
    schema_version: number;
    instance_id: string;
    provider_version: string;
    provider_session_id: string;
    writer_pid: number;
    revision: number;
    status: string;
    reply_keys: string[];
    prompt: unknown;
  };
  const waitForStatus = async (status: string, afterRevision: number): Promise<StatusReport> => {
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        const report = JSON.parse(readFileSync(reportPath, "utf8")) as StatusReport;
        if (report.status === status && report.revision > afterRevision) return report;
      } catch { /* The next atomic snapshot may not exist yet. */ }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error(`native ${status} snapshot was not published`);
  };
  try {
    process.env.AOE_INSTANCE_ID = instanceId;
    delete process.env.TMUX_PANE;
    ompExtension(pi);
    await handlers.get("session_start")?.({}, {
      sessionManager: { getSessionId: () => "provider-session" },
      ui: { onTerminalInput: () => () => {} },
    });
    const started = JSON.parse(readFileSync(reportPath, "utf8")) as StatusReport;
    expect(started).toMatchObject({
      schema_version: 1,
      instance_id: instanceId,
      provider_version: "18.11.3-rc.1",
      provider_session_id: "provider-session",
      writer_pid: process.pid,
      revision: 0,
      status: "running",
      reply_keys: ["F12"],
      prompt: null,
    });
    handlers.get("agent_end")?.();
    const idle = await waitForStatus("idle", started.revision);
    handlers.get("agent_start")?.();
    const resumed = await waitForStatus("running", idle.revision);
    handlers.get("agent_end")?.();
    const finished = await waitForStatus("idle", resumed.revision);
    expect([idle.revision, resumed.revision, finished.revision]).toEqual([
      started.revision + 1,
      idle.revision + 1,
      resumed.revision + 1,
    ]);
  } finally {
    const shutdown = handlers.get("session_shutdown");
    if (shutdown) await Promise.resolve(shutdown());
    if (previousInstanceId === undefined) delete process.env.AOE_INSTANCE_ID;
    else process.env.AOE_INSTANCE_ID = previousInstanceId;
    if (previousPane === undefined) delete process.env.TMUX_PANE;
    else process.env.TMUX_PANE = previousPane;
    rmSync(path.dirname(reportPath), { recursive: true, force: true });
  }
});
