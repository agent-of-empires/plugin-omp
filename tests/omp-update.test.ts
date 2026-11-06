import { expect, test } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const updater = path.resolve(import.meta.dir, "../scripts/update-omp-version.mjs");

test("release updater proposes both bounds once and rejects inconsistent bounds", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "omp-update-test-"));
  const manifest = path.join(dir, "aoe-plugin.toml");
  const pkg = path.join(dir, "omp-extension/package.json");
  try {
    mkdirSync(path.dirname(pkg));
    writeFileSync(manifest, 'provider_versions = ["=18.16.0"]\n');
    writeFileSync(pkg, '{\n  "@oh-my-pi/pi-coding-agent": "=18.16.0"\n}\n');
    const run = (mode: string, version: string) => execFileSync(process.execPath, [updater, mode, version], { cwd: dir, encoding: "utf8" }).trim();
    expect(run("check", "18.17.0")).toBe("update");
    expect(run("apply", "18.17.0")).toBe("updated");
    expect(run("check", "18.17.0")).toBe("supported");
    expect(run("apply", "18.17.0")).toBe("supported");
    expect(readFileSync(manifest, "utf8")).toBe('provider_versions = ["=18.16.0", "=18.17.0"]\n');
    expect(JSON.parse(readFileSync(pkg, "utf8"))["@oh-my-pi/pi-coding-agent"]).toBe("=18.16.0 || =18.17.0");
    writeFileSync(manifest, 'provider_versions = ["=18.16.0"]\n');
    expect(spawnSync(process.execPath, [updater, "apply", "18.17.0"], { cwd: dir }).status).not.toBe(0);
    expect(spawnSync(process.execPath, [updater, "apply", "18.17.0-rc.1"], { cwd: dir }).status).not.toBe(0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
