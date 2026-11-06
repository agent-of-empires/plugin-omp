import { readFileSync, statSync, writeFileSync } from "node:fs";
import { createAssistantMessageEventStream } from "@oh-my-pi/pi-ai";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent/extensibility/extensions";

export default function (pi: ExtensionAPI): void {
  let stops = 0;
  let calls = 0;
  pi.registerProvider("aoe-smoke", {
    baseUrl: "http://127.0.0.1:9/v1", apiKey: "offline", api: "aoe-smoke",
    models: [{ id: "status", name: "Status smoke", reasoning: false, input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 32768, maxTokens: 128 }],
    streamSimple(model) {
      const stream = createAssistantMessageEventStream();
      const message = { role: "assistant" as const, api: model.api, provider: model.provider, model: model.id,
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
        timestamp: Date.now(), content: [{ type: "text" as const, text: "done" }], stopReason: "stop" as const };
      const finish = () => {
        stream.push({ type: "start", partial: message });
        stream.push({ type: "done", reason: "stop", message });
      };
      if (++calls === 1) finish();
      else setTimeout(finish, 300);
      return stream;
    },
  });
  pi.on("session_stop", () => ++stops === 1 ? { continue: true, additionalContext: "Continue once." } : undefined);
  pi.on("agent_end", async event => {
    if (!event.willContinue) return;
    const marker = process.env.OMP_STATUS_SMOKE_MARKER;
    const instance = process.env.AOE_INSTANCE_ID;
    if (!marker || !instance) return;
    const report = `/tmp/aoe-hooks-${process.getuid()}/${instance}/integration-omp.agent-of-empires.json`;
    const before = statSync(report).ino;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        if (statSync(report).ino !== before && JSON.parse(readFileSync(report, "utf8")).status === "running") {
          writeFileSync(marker, "continuation-running-ok\n");
          return;
        }
      } catch { /* The atomic report may not have been published yet. */ }
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 10);
      await promise;
    }
  });
}
