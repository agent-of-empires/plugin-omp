# OMP integration for Agent of Empires

Provider-native OMP session status and explicit approval/question replies in AoE's terminal session list. This repository was scaffolded from the [official AoE plugin template](https://github.com/agent-of-empires/plugin-template), then specialized for the paired integration; the template's generic JSON-RPC worker is omitted because this manifest does not declare a worker runtime.

## Separate runtime targets

This repository contains two independently installed artifacts:

- `aoe-plugin.toml` is the AoE plugin manifest. Install it from the repository root with `aoe plugin install .` and approve its `session.integration` capability through AoE's normal install flow.
- `omp-extension/` is the provider-native OMP extension. Install it separately with `omp plugin install "$PWD/omp-extension"`. Both artifacts allowlist OMP versions `18.10.4`, `18.11.1`, and `18.11.3`; `18.10.3` lacks the approval-key API required by the native reply bridge.

The disposable-HOME report smoke passed on each allowlisted release. `18.11.2` and `18.12.x` remain excluded because this extension/runtime combination has not been verified there; this is not a claim of known incompatibility.

This companion depends on the native report/reply host work in [#4783](https://github.com/agent-of-empires/agent-of-empires/pull/4783) and the generic launch contract in [#4782](https://github.com/agent-of-empires/agent-of-empires/pull/4782). AoE main currently uses API 19 without `agent_integrations`. Do not install or merge this manifest until the changes from both host pull requests have landed; launch/discovery alone does not provide report/reply transport. This is a cross-repository dependency, not a GitHub stacked-PR base.

The manifest declares the generic launch contract: `tool = "omp"`, `command = "omp"`, and `resume_arg = "--resume {session_id}"`. The host's stored resume argument remains authoritative; the provider session ID in reports is correlation only.

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
