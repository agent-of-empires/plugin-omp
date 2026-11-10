import { expect, mock, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { readFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import ompExtension, { integrationDirectory } from "../omp-extension/index.ts";

mock.module("@oh-my-pi/pi-coding-agent", () => ({ VERSION: "18.17.0" }));

type Report = { status: string; prompt: { kind: string; id: string } | null; revision: number };
const questions = [{ id: "choice", question: "Choose", options: [{ label: "one" }] }];

async function withReporter(run: (reporter: {
  emit: (event: string, value?: unknown) => unknown;
  ui: { askDialog: (questions: typeof questions) => Promise<unknown>; approve: (approval: { compact: string }) => Promise<unknown> };
  asks: PromiseWithResolvers<undefined>[];
  approvals: PromiseWithResolvers<boolean>[];
  change: (action: () => unknown) => Promise<Report>;
}) => Promise<void>): Promise<void> {
  const previousInstance = process.env.AOE_INSTANCE_ID;
  const instance = `status-${process.pid}-${randomUUID()}`;
  const file = path.join(integrationDirectory(process.getuid(), instance), "integration-agent-of-empires.omp.json");
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  const asks: PromiseWithResolvers<undefined>[] = [];
  const approvals: PromiseWithResolvers<boolean>[] = [];
  const ui = {
    onTerminalInput: () => () => {},
    askDialog: async () => { const pending = Promise.withResolvers<undefined>(); asks.push(pending); return pending.promise; },
    approve: async () => { const pending = Promise.withResolvers<boolean>(); approvals.push(pending); return pending.promise; },
  };
  try {
    process.env.AOE_INSTANCE_ID = instance;
    const pi = { on: (event: string, handler: (...args: unknown[]) => unknown) => handlers.set(event, handler) } as unknown as Parameters<typeof ompExtension>[0];
    ompExtension(pi);
    await handlers.get("session_start")!({}, { sessionManager: { getSessionId: () => "status-session" }, ui });
    await run({
      emit: (event, value = {}) => handlers.get(event)?.(value), ui, asks, approvals,
      change: async action => {
        const before = statSync(file).ino;
        await action();
        for (let attempt = 0; attempt < 100; attempt++) {
          if (statSync(file).ino !== before) return JSON.parse(readFileSync(file, "utf8"));
          // Poll the real asynchronous filesystem publication; fake timers cannot advance it.
          await Bun.sleep(10);
        }
        throw new Error("status report was not refreshed");
      },
    });
  } finally {
    await handlers.get("session_shutdown")?.();
    if (previousInstance === undefined) delete process.env.AOE_INSTANCE_ID;
    else process.env.AOE_INSTANCE_ID = previousInstance;
    rmSync(path.dirname(file), { recursive: true, force: true });
  }
}

test("nonterminal ends keep automatic continuations and background work running", async () => {
  await withReporter(async ({ emit, change }) => {
    for (const end of [{ willContinue: true }, { willContinue: true, awaitingAsyncWork: true }]) {
      expect((await change(() => emit("agent_end", end))).status).toBe("running");
    }
    expect((await change(() => emit("agent_end"))).status).toBe("idle");
  });
});

test("a real question stays waiting across starts and closes to the settled activity", async () => {
  await withReporter(async ({ emit, ui, asks, change }) => {
    let dialog!: Promise<unknown>;
    const waiting = await change(() => { dialog = ui.askDialog(questions); });
    expect(waiting).toMatchObject({ status: "waiting", prompt: { kind: "question" } });
    expect(await change(() => emit("agent_start"))).toEqual(waiting);
    expect(await change(() => emit("agent_end"))).toEqual(waiting);
    expect(await change(async () => { asks[0]!.resolve(undefined); await dialog; })).toMatchObject({ status: "idle", prompt: null });
  });
});

test("nonreplyable native approvals stay waiting even at an agent end", async () => {
  await withReporter(async ({ emit, ui, approvals, change }) => {
    let dialog!: Promise<unknown>;
    expect(await change(() => { dialog = ui.approve({ compact: "Native approval" }); })).toMatchObject({ status: "waiting", prompt: null });
    expect((await change(() => emit("agent_end"))).status).toBe("waiting");
    expect(await change(async () => { approvals[0]!.resolve(false); await dialog; })).toMatchObject({ status: "idle", prompt: null });
  });
});
