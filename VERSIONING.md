# Versioning and compatibility

This repository is a application or test workspace in the SearSuite organization.

## Current status

Versions in `package.json` describe the current source baseline; they do not by themselves indicate an npm release or a support commitment. Packages below 1.0.0 are experimental. Breaking changes may occur before 1.0.0 and must be called out in the changelog when released.

## Release policy

- A maintainer records user-visible changes under **Unreleased** in `CHANGELOG.md` with the affected package names.
- Before a release, a maintainer chooses the next version, updates affected manifests and dependency ranges, moves the relevant changelog entries into a dated version section, runs the repository checks, and tags the release. No release is automatic.
- After 1.0.0, follow SemVer: major for incompatible public API changes, minor for backward-compatible features, patch for backward-compatible fixes. Before 1.0.0, read each changelog entry for compatibility impact.
- A release is supported only while its declared dependency and runtime ranges remain satisfied; maintenance of older releases is handled case by case.

## Compatibility

- Source checkouts in this organization are developed together. For cross-repository integrations, use a set of revisions validated together; a matching package version alone does not imply cross-repository compatibility.
- Node.js 22 or newer is the supported development baseline. Existing narrower or broader per-package `engines` declarations remain authoritative for that package. pnpm workspaces use the `packageManager` version in the root manifest; npm-based workspaces use their documented npm commands.
- Public API compatibility is based on documented package entry points and exported types.
