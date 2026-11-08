# Changelog

All notable changes to OMP Integration will be documented in this file.

The format follows [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Changed
- Accept stable OMP releases from 18.10.4 through major version 18 in both the manifest and extension peer requirements, and update the native smoke's version check.
- Declare the OMP companion as an API 19 integration with bounded provider versions, the generic launch command, and explicit native reply capability.
- Read the loaded OMP package version and align provider support bounds with the native reply API.
- Match schema-1 report fields and reject external question answers after parent cancellation.
- Run the disposable-HOME native smoke without a model turn.
