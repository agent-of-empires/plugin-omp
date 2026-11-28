# OMP integration for Agent of Empires

Provider-native OMP session status and explicit approval/question replies in AoE's terminal session list. This repository was scaffolded from the [official AoE plugin template](https://github.com/agent-of-empires/plugin-template), then specialized for the paired integration; the template's generic JSON-RPC worker is omitted because this manifest does not declare a worker runtime.

## Separate runtime targets

This repository contains two independently installed artifacts:

- `aoe-plugin.toml` is the AoE plugin manifest. From a checkout, install it with `aoe plugin install --dev .` and approve its `session.integration` capability through AoE's normal install flow. The id sits in the reserved `agent-of-empires.*` namespace, so a plain `aoe plugin install` or `gh:` install is refused until core's featured index pins a release of this repository.
- `omp-extension/` is the provider-native OMP extension. Install it separately with `omp plugin install "$PWD/omp-extension"`. Both artifacts support stable OMP releases from `18.10.4` up to, but excluding, `20.0.0`; `18.10.3` lacks the approval-key API required by the native reply bridge.

Future OMP 18.x and 19.x releases are assumed compatible under SemVer; regressions will be patched as needed. Prereleases are excluded by the version requirements. The disposable-HOME report smoke previously passed on `18.10.4`, `18.11.1`, `18.11.3`, and `18.16.0`. The 19.x range extension was checked against `19.0.1`'s published extension typings, where the extension API this adapter uses (the `VERSION` export, `ExtensionAPI.pi`, `ui.askDialog`, `ui.approve`, `ui.onTerminalInput`, the lifecycle/approval events, and the `app.approval.approve` and `tui.select.cancel` keybindings) is unchanged; not every supported release has been individually verified in the smoke.

This manifest requires an AoE host that accepts `api_version = 28` and reads the `extension_sidecar` capture backend (`agent-of-empires#6060`; the capture backend is declared in `aoe-plugin-api` and consumed in `src/plugin/agent_integration.rs` of the core repo). No released host declares API 28 yet: the latest release, `1.26.0`, is API 25, and the newest nightly is API 28 without the backend, so this manifest is only installable against a host built from that branch or from the release that ships it. Hosts that predate it reject the manifest with an unsupported-API-version or invalid-declaration error and keep the bundled OMP fallback, so an older host cannot load this plugin. An approved, enabled declaration supersedes that fallback for `omp`, which is what makes the released plugin authoritative.

The manifest declares OMP's command, launch flags, sandbox environment, resume and capture behavior, and native-only status detection. The extension writes the provider session ID into the session's AoE integration directory as `session_id.<launch id>`, taken from the `AOE_SESSION_SOURCE` the launch sets, so an earlier launch's id is never read as this launch's conversation; the same ID in reports is correlation only. A sandboxed launch mounts that directory and names it in `AOE_INTEGRATION_DIR`, so the extension writes where the host reads without deriving a path from a uid it does not have.

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

Validate the manifest against the pinned AoE schema with `cargo test --locked --manifest-path tests/manifest/Cargo.toml`. The pin is the `agent-of-empires#6060` head, because it is the only host that gates `extension_sidecar` at `api_version >= 28`; the test asserts the shipped manifest validates cleanly there, that API 20 rejects the declarations, and that API 27 rejects the sidecar capture backend. Re-point the pin at the release that ships the backend before tagging.

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
