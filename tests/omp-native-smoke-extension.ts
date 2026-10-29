import { readFileSync, writeFileSync } from "node:fs";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent/extensibility/extensions";

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

export default function (pi: ExtensionAPI): void {
  pi.on("session_start", async (_event, ctx) => {
    const marker = process.env.OMP_SMOKE_MARKER;
    const instanceId = process.env.AOE_INSTANCE_ID;
    const expectedVersion = process.env.OMP_EXPECTED_VERSION;
    try {
      if (!marker || !instanceId || !expectedVersion || typeof process.getuid !== "function") throw new Error("missing smoke identity or expected version");
      const reportPath = `/tmp/aoe-hooks-${process.getuid()}/${instanceId}/integration-omp.agent-of-empires.json`;
      for (let attempt = 0; attempt < 40; attempt++) {
        try {
          const report = JSON.parse(readFileSync(reportPath, "utf8")) as {
            instance_id?: string;
            provider_session_id?: string;
            provider_version?: string;
            writer_pid?: number;
            status?: string;
            reply_keys?: string[];
          };
          if (report.instance_id === instanceId && typeof report.provider_session_id === "string" &&
              report.provider_session_id.length > 0 &&
              report.provider_version === expectedVersion &&
              /^18\.(10\.4|11\.[13])$/.test(report.provider_version ?? "") &&
              report.writer_pid === process.pid && report.status === "running" &&
              JSON.stringify(report.reply_keys) === JSON.stringify(["F12"])) {
            writeFileSync(marker, "integration-snapshot-ok\n", { mode: 0o600 });
            return;
          }
        } catch {
          // The provider extension may still be writing its first report.
        }
        await delay(50);
      }
      throw new Error("provider extension did not publish its snapshot");
    } catch {
      if (marker) writeFileSync(marker, "integration-snapshot-missing\n", { mode: 0o600 });
    } finally {
      ctx.shutdown();
    }
  });
}
