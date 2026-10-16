# OMP integration for Agent of Empires

Provider-native OMP session status and explicit approval/question replies in AoE's terminal session list. This repository was scaffolded from the [official AoE plugin template](https://github.com/agent-of-empires/plugin-template), then specialized for the paired integration; the template's generic JSON-RPC worker is omitted because this manifest does not declare a worker runtime.

## Separate runtime targets

This repository contains two independently installed artifacts:

- `aoe-plugin.toml` is the AoE plugin manifest. Install it from the repository root with `aoe plugin install .` and approve its `session.integration` capability through AoE's normal install flow.
- `omp-extension/` is the provider-native OMP extension. Install it separately with `omp plugin install "$PWD/omp-extension"`. It requires OMP 18.11.1 or newer.

Install each artifact with its own plugin manager. Existing OMP sessions do not load newly installed extensions; restart the OMP process or start a new OMP session.

## Behavior

The OMP extension observes OMP's native approval and question UI and publishes provider session status and prompt snapshots. In AoE's session list, select the matching OMP session and press `a` to open the approval or question dialog. AoE validates the reply against the current prompt, then writes it to a private integration sidecar and delivers it through the existing terminal transport. The OMP extension maps approval/cancel replies to OMP's configured keybindings and submits question answers through OMP's native dialog.

OMP remains the approval authority. The extension does not intercept tool execution or approve calls for AoE; there is no AoE approval broker, per-tool gate, or `--auto-approve`. If extension observation or reply delivery fails, OMP's native prompt remains available.

The AoE manifest grant authorizes AoE's integration report and reply path; it does not authorize OMP's in-process extension code. The two artifacts are separate trust and runtime targets.

## Development and checks

```bash
cd omp-extension && bun test ../tests
```

The optional live smoke test runs an installed OMP CLI and may require a configured model/provider:

```bash
OMP_BIN=omp ./tests/omp-native-smoke.sh
```

This is a focused OMP example, not a general provider-extension bridge or a marketplace bundle. Coordinated installation, upgrades, and release packaging are out of scope.

## License

MIT
