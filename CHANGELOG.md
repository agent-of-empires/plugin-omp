# Changelog

All notable changes to OMP Integration will be documented in this file.

The format follows [Conventional Commits](https://www.conventionalcommits.org/).

## [0.5.0] - 2026-11-16

### Changed
- **Breaking:** Require AoE `1.24.0` or newer for launch and detection declarations. Older hosts reject the manifest and keep the bundled OMP fallback.
- **Breaking:** Rename the plugin id from `omp.agent-of-empires` to `agent-of-empires.omp`, which changes the report sidecar names and does not upgrade an existing 0.4.x install. Uninstall the old id before installing 0.5.0.
- Match the OMP extension package version to the release so the 0.4.x and 0.5.0 extensions, which write different report sidecar names, no longer share one version string.
- Accept stable OMP releases from 18.10.4 through major version 18 in both the manifest and extension peer requirements, and update the native smoke's version check.
- Declare core's OMP launch, resume, capture, YOLO, sandbox environment, and native status detection through AoE agent declarations.
- Declare bounded provider versions, the OMP launch command, and explicit native reply capability.
- Read the loaded OMP package version and align provider support bounds with the native reply API.
- Match schema-1 report fields and reject external question answers after parent cancellation.
- Run the disposable-HOME native smoke without a model turn.
- Check supported stable OMP releases with compatibility tests and the native startup smoke; flag out-of-range releases for manual review.

### Fixed
- Validate the manifest against AoE `1.24.0`, the first released host that accepts API 21, instead of a staged schema that rejects it, and replace the README's stale "current hosts cannot load this manifest" note with the `1.24.0` requirement.
- Replace unsupported `resume_arg` metadata with the agent resume declaration.
- Replace the stale host-merge warning with the actual launch/discovery and report/reply installation requirements.
- Keep automatic continuations running and preserve waiting while a native question or approval is open.
