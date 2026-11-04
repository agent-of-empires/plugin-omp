# OMP integration for Agent of Empires

Provider-native OMP session status and explicit approval/question replies in AoE's terminal session list. This repository was scaffolded from the [official AoE plugin template](https://github.com/agent-of-empires/plugin-template), then specialized for the paired integration; the template's generic JSON-RPC worker is omitted because this manifest does not declare a worker runtime.

## Separate runtime targets

This repository contains two independently installed artifacts:

- `aoe-plugin.toml` is the AoE plugin manifest. Install it from the repository root with `aoe plugin install .` and approve its `session.integration` capability through AoE's normal install flow.
- `omp-extension/` is the provider-native OMP extension. Install it separately with `omp plugin install "$PWD/omp-extension"`. Both artifacts allowlist OMP versions `18.10.4`, `18.11.1`, `18.11.3`, and `18.16.0`; `18.10.3` lacks the approval-key API required by the native reply bridge.

The disposable-HOME report smoke passed on each allowlisted release, including `18.16.0`. `18.11.2` and `18.12.x` through `18.15.x` remain excluded because this extension/runtime combination has not been verified there; this is not a claim of known incompatibility.

Installation requires an AoE build containing both the generic launch/discovery contract from [#4782](https://github.com/agent-of-empires/agent-of-empires/pull/4782) and the native report/reply transport from [#4783](https://github.com/agent-of-empires/agent-of-empires/pull/4783). Both are merged into AoE main as of 2026-11-04; use merge commit `b1e7d28b` or a descendant containing both changes. API 19 alone is not sufficient.

The manifest declares `tool = "omp"`, `command = "omp"`, bounded `provider_versions`, and `replies = true`. Resume remains native in AoE; the host's stored resume argument remains authoritative, and the provider session ID in reports is correlation only. Saved-session identity and resume must keep working before native OMP capture is removed ([#4571](https://github.com/agent-of-empires/agent-of-empires/issues/4571)).

Install each artifact with its own plugin manager. Existing OMP sessions do not load newly installed extensions; restart the OMP process or start a new OMP session.

## Behavior

The OMP extension observes OMP's native approval and question UI and publishes schema-1 provider status and prompt snapshots, including the runtime version, provider session correlation ID, live writer PID, monotonically changing revision, and native reply key strings (`F12`). The manifest opts into replies because this adapter has a real interactive bridge; status-only integrations need no fake reply keys. In AoE's session list, select the matching OMP session and press `a` to open the approval or question dialog. AoE validates each reply against the current prompt, then writes it to a private integration sidecar and delivers it through the existing terminal transport. The OMP extension maps approval/cancel replies to OMP's configured keybindings and submits question answers through OMP's native dialog. Native completion or cancellation rejects later sidebar answers.

OMP remains the approval authority. The extension does not intercept tool execution or approve calls for AoE; there is no AoE approval broker, per-tool gate, or `--auto-approve`. If extension observation or reply delivery fails, OMP's native prompt remains available.

The AoE manifest grant authorizes AoE's integration report and reply path; it does not authorize OMP's in-process extension code. The two artifacts are separate trust and runtime targets.

## Development and checks

```bash
cd omp-extension && bun test ../tests
```

The runtime smoke uses an isolated disposable `HOME`, exercises OMP extension loading and report publication without submitting a prompt to a model, and does not modify the user's OMP configuration:

```bash
OMP_BIN=omp ./tests/omp-native-smoke.sh
```

Set `OMP_BIN` to the command or path of an installed supported OMP release when the default `omp` executable differs.

This is a focused OMP example, not a general provider-extension bridge or a marketplace bundle. Coordinated installation, upgrades, and release packaging are out of scope.

## License

MIT
