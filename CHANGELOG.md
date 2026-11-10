# Changelog

All notable changes to OMP Integration will be documented in this file.

The format follows [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Changed
- **Breaking:** Require AoE API 21 for launch and detection declarations. A host implementing API 21 and the declaration consumer must be released before this plugin can be installed.
- Accept stable OMP releases from 18.10.4 through major version 18 in both the manifest and extension peer requirements, and update the native smoke's version check.
- Declare core's OMP launch, resume, capture, YOLO, sandbox environment, and native status detection through AoE agent declarations.
- Declare bounded provider versions, the OMP launch command, and explicit native reply capability.
- Read the loaded OMP package version and align provider support bounds with the native reply API.
- Match schema-1 report fields and reject external question answers after parent cancellation.
- Run the disposable-HOME native smoke without a model turn.
- Check supported stable OMP releases with compatibility tests and the native startup smoke; flag out-of-range releases for manual review.

### Fixed
- Replace unsupported `resume_arg` metadata with the agent resume declaration.
- Replace the stale host-merge warning with the actual launch/discovery and report/reply installation requirements.
- Keep automatic continuations running and preserve waiting while a native question or approval is open.
