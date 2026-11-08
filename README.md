# OMP integration for Agent of Empires

Provider-native OMP session status and explicit approval/question replies in AoE's terminal session list. This repository was scaffolded from the [official AoE plugin template](https://github.com/agent-of-empires/plugin-template), then specialized for the paired integration; the template's generic JSON-RPC worker is omitted because this manifest does not declare a worker runtime.

## Separate runtime targets

This repository contains two independently installed artifacts:

- `aoe-plugin.toml` is the AoE plugin manifest. Install it from the repository root with `aoe plugin install .` and approve its `session.integration` capability through AoE's normal install flow.
- `omp-extension/` is the provider-native OMP extension. Install it separately with `omp plugin install "$PWD/omp-extension"`. Both artifacts support stable OMP releases from `18.10.4` up to, but excluding, `19.0.0`; `18.10.3` lacks the approval-key API required by the native reply bridge.

Future OMP 18.x releases are assumed compatible under SemVer; regressions will be patched as needed. Prereleases are excluded by the version requirements. The disposable-HOME report smoke previously passed on `18.10.4`, `18.11.1`, `18.11.3`, and `18.16.0`; not every supported release has been individually verified.

This companion depends on the native report/reply and API 20 agent extraction in [AoE #5380](https://github.com/agent-of-empires/agent-of-empires/pull/5380). Install it on an AoE host that includes that contract; this is a cross-repository dependency, not a GitHub stacked-PR base.

The manifest declares OMP's command, launch flags, sandbox environment, resume and capture behavior, and native-only status detection. The provider session ID in reports is correlation only.

Install each artifact with its own plugin manager. Existing OMP sessions do not load newly installed extensions; restart the OMP process or start a new OMP session.

## Behavior

The OMP extension observes OMP's native approval and question UI and publishes schema-1 provider status and prompt snapshots, including the runtime version, provider session correlation ID, live writer PID, monotonically changing revision, and native reply key strings (`F12`). The manifest opts into replies because this adapter has a real interactive bridge; status-only integrations need no fake reply keys. In AoE's session list, select the matching OMP session and press `a` to open the approval or question dialog. AoE validates each reply against the current prompt, then writes it to a private integration sidecar and delivers it through the existing terminal transport. The OMP extension maps approval/cancel replies to OMP's configured keybindings and submits question answers through OMP's native dialog. Native completion or cancellation rejects later sidebar answers.

OMP remains the approval authority. The extension does not intercept tool execution or approve calls for AoE; there is no AoE approval broker, per-tool gate, or `--auto-approve`. If extension observation or reply delivery fails, OMP's native prompt remains available.

Automatic continuations and pending background work remain running; an open native approval or question takes precedence as waiting. AoE must also validate that the report writer belongs to the managed pane: the extension alone cannot prevent an unrelated live process with an inherited instance ID from overwriting the shared report.

The AoE manifest grant authorizes AoE's integration report and reply path; it does not authorize OMP's in-process extension code. The two artifacts are separate trust and runtime targets.

## Development and checks

```bash
cd omp-extension && bun test ../tests
```

Validate the manifest against the pinned AoE API 20 schema with `cargo test --locked --manifest-path tests/manifest/Cargo.toml`.

The runtime smoke uses an isolated disposable `HOME`, exercises OMP extension loading and report publication without submitting a prompt to a model, and does not modify the user's OMP configuration:

```bash
OMP_BIN=omp ./tests/omp-native-smoke.sh
```

Set `OMP_BIN` to the command or path of an installed supported OMP release when the default `omp` executable differs.

### OMP release updates

`.github/workflows/omp-updates.yml` checks the latest stable [OMP release](https://github.com/can1357/oh-my-pi/releases) daily or on manual dispatch. For supported versions, it verifies the published Linux binary checksum and runs the full Bun suite and native startup smoke. An out-of-range release requires manual compatibility review; the smoke does not exercise interactive replies.

This is a focused OMP example, not a general provider-extension bridge or a marketplace bundle. Coordinated installation, upgrades, and release packaging are out of scope.

## License

MIT
