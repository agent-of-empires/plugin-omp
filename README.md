# OMP integration for Agent of Empires

Provider-native OMP session status and explicit approval/question replies in AoE's terminal session list. This repository was scaffolded from the [official AoE plugin template](https://github.com/agent-of-empires/plugin-template), then specialized for the paired integration; the template's generic JSON-RPC worker is omitted because this manifest does not declare a worker runtime.

## Separate runtime targets

This repository contains two independently installed artifacts:

- `aoe-plugin.toml` is the AoE plugin manifest. Install it from the repository root with `aoe plugin install .` and approve its `session.integration` capability through AoE's normal install flow.
- `omp-extension/` is the provider-native OMP extension. Install it separately with `omp plugin install "$PWD/omp-extension"`. Both artifacts declare the OMP provider versions `>=18.10.3, <=18.10.4`, `18.11.1`, and `18.11.3`; the extension peer dependencies and AoE manifest use the same bounded ranges.

This companion requires AoE's API 19 native-report/reply host layer; the launch/discovery-only foundation does not provide its report or reply transport. The host implementation is tracked separately in [agent-of-empires/agent-of-empires#4783](https://github.com/agent-of-empires/agent-of-empires/pull/4783); this cross-repository dependency is not a GitHub stacked-PR base.

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

This is a focused OMP example, not a general provider-extension bridge or a marketplace bundle. Coordinated installation, upgrades, and release packaging are out of scope.

## License

MIT
