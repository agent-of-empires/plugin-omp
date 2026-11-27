# Changelog

All notable changes to OMP Integration will be documented in this file.

The format follows [Conventional Commits](https://www.conventionalcommits.org/).

## [0.7.0](https://github.com/agent-of-empires/plugin-omp/compare/v0.6.0...v0.7.0) (2026-11-27)


### ⚠ BREAKING CHANGES

* **manifest:** prepare for aoe api 21 ([#16](https://github.com/agent-of-empires/plugin-omp/issues/16))

### Features

* **omp:** add paired status and prompt integration ([f7e926e](https://github.com/agent-of-empires/plugin-omp/commit/f7e926eb4390013f2819479a985c913175d19dc4))
* **omp:** align companion with API19 host ([#1](https://github.com/agent-of-empires/plugin-omp/issues/1)) ([1a70283](https://github.com/agent-of-empires/plugin-omp/commit/1a702833b491ec53d06cc19ef17d442d23910924))
* **omp:** declare API 20 agent integration ([#11](https://github.com/agent-of-empires/plugin-omp/issues/11)) ([e471d8d](https://github.com/agent-of-empires/plugin-omp/commit/e471d8d9b10ece06236fc6b3c1038d5595858869))
* **omp:** support OMP 18.16.0 ([#4](https://github.com/agent-of-empires/plugin-omp/issues/4)) ([86eb069](https://github.com/agent-of-empires/plugin-omp/commit/86eb0697d641324d2b355edd2bf6b48767c3531d))


### Bug Fixes

* accept compatible OMP 18.x releases ([#13](https://github.com/agent-of-empires/plugin-omp/issues/13)) ([c7ab743](https://github.com/agent-of-empires/plugin-omp/commit/c7ab74301c3c09e75a608470babe36ef7fa88311))
* **manifest:** accept OMP 19.x provider releases ([#23](https://github.com/agent-of-empires/plugin-omp/issues/23)) ([9e84524](https://github.com/agent-of-empires/plugin-omp/commit/9e84524a7617f544ad448bf07eb964231187afa6))
* **manifest:** prepare for aoe api 21 ([#16](https://github.com/agent-of-empires/plugin-omp/issues/16)) ([1f529b2](https://github.com/agent-of-empires/plugin-omp/commit/1f529b2b5f7298342011d1a79db7bb04069a0887))
* **manifest:** remove unsupported resume metadata ([#3](https://github.com/agent-of-empires/plugin-omp/issues/3)) ([b7bc3cf](https://github.com/agent-of-empires/plugin-omp/commit/b7bc3cf0b9cf8e86ba1ff5958d6bc2cff00377a7))
* **manifest:** validate against the released API 21 host ([#18](https://github.com/agent-of-empires/plugin-omp/issues/18)) ([2863be6](https://github.com/agent-of-empires/plugin-omp/commit/2863be6a5425870c24316f7e9faa716c4019546f))
* **omp:** read the reply keymap from the injected SDK ([#6](https://github.com/agent-of-empires/plugin-omp/issues/6)) ([27a679c](https://github.com/agent-of-empires/plugin-omp/commit/27a679c05dbe4a55cce3a4b192a25f8007f98d9d))
* stabilize omp status and propose release updates ([#8](https://github.com/agent-of-empires/plugin-omp/issues/8)) ([be12ece](https://github.com/agent-of-empires/plugin-omp/commit/be12ece8bd257176ef8e1dd90be35eab94bc1777))

## [0.6.0] - 2026-11-22

### Changed
- Accept stable OMP 19.x releases by widening the manifest provider range and the extension peer requirement to `>=18.10.4, <20.0.0`, and update the native smoke's version check. OMP `19.0.1` keeps every extension API this adapter uses, so no code change was needed.

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
