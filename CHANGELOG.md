# Changelog

All notable changes to OMP Integration will be documented in this file.

The format follows [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Changed
- Declare core's OMP launch, resume, capture, YOLO, sandbox environment, and native status detection through AoE API 20.
- Declare the OMP companion as an API 19 integration with bounded provider versions, the generic launch command, and explicit native reply capability.
- Read the loaded OMP package version and align provider support bounds with the native reply API.
- Match schema-1 report fields and reject external question answers after parent cancellation.
- Run the disposable-HOME native smoke without a model turn.
- Support OMP 18.16.0: add it to both allowlists and drop the smoke fixture's hardcoded version list so a supported release outside the original three is verified instead of reported missing.
- Check new stable OMP releases with compatibility tests and propose bounded version updates as draft pull requests.

### Fixed
- Remove unsupported `resume_arg` metadata so the manifest installs on the merged API 19 host; resume remains native in AoE.
- Replace the stale host-merge warning with the actual launch/discovery and report/reply installation requirements.
- Keep automatic continuations running and preserve waiting while a native question or approval is open.
