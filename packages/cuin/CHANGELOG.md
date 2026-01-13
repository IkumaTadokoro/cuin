# @ikuma-t/cuin

## 0.2.2

### Patch Changes

- 076f76f: Fix ERR_MODULE_NOT_FOUND error when running pnpx @ikuma-t/cuin. The bin.mjs was trying to import ./dist/index.js, but tsdown actually outputs ./dist/index.mjs. This mismatch caused the published package to fail on execution.
  - @ikuma-t/cuin-analyzer@0.2.2

## 0.2.0

### Minor Changes

- da70fc2: Add file watching with real-time analysis updates

  - Add file watcher using chokidar to detect changes in analyzed directory
  - Implement Server-Sent Events (SSE) for real-time communication between server and UI
  - Add visual status indicators in UI for analysis progress
  - Support `--watch` flag (enabled by default) to toggle file watching
  - Auto-refetch data in UI when analysis completes
  - Add proper cleanup on SIGINT signal

### Patch Changes

- @ikuma-t/cuin-analyzer@0.2.0

## 0.1.0

### Minor Changes

- decd973: Add copy button to component detail page for exporting filtered results as Markdown

  - Copy filtered component usage results to clipboard in Markdown format
  - Output includes component name, package info, usage summary grouped by package, and detailed code snippets
  - Tooltip shows on hover with instant display and arrow indicator

### Patch Changes

- @ikuma-t/cuin-analyzer@0.1.0

## 0.0.20

### Patch Changes

- 1582fd2: fix: move UI dependencies to devDependencies to reduce install size

  - Move SolidJS, Shiki, Ark UI and other UI packages to devDependencies
  - UI is bundled at build time, so runtime dependencies are not required
  - Extract dist directory resolution logic to shared module
  - @ikuma-t/cuin-analyzer@0.0.20

## 0.0.19

### Patch Changes

- 501ccae: refactor: re-organize packages
- 7591ebb: fix: analyze command

  - Add `await` to `getAnalysisAsJson` call
  - Suppress `header` and `usage` output via `rendering` option
  - @ikuma-t/cuin-analyzer@0.0.19

## 0.0.18

### Patch Changes

- 18177f9: fix: use correct package version
- f8b3b4c: perf: optimize performance
- c5a18b6: build: configure renovate
- fd0aef6: refactor: details group expand logic and context
- 8e70b77: perf: optimize ui bundle size
- Updated dependencies [f8b3b4c]
  - @ikuma-t/cuin-analyzer@0.0.18

## 0.0.17

### Patch Changes

- c42ac0f: chore: test OIDC release
- Updated dependencies [c42ac0f]
  - @ikuma-t/cuin-analyzer@0.0.17

## 0.0.16

### Patch Changes

- ebd7a73: ci: migrate to changesets-based release with OIDC
- Updated dependencies [ebd7a73]
  - @ikuma-t/cuin-analyzer@0.0.16

## 0.0.11

### Patch Changes

- - Migrate from SolidStart to Solid Router
  - Add URL sync for filter conditions
  - Add package filter feature
  - Minor fixes
- Updated dependencies
  - cuin-analyzer@0.0.11

## 0.0.10

### Patch Changes

- contentvisibilityautostatechange と Context で遅延ハイライトを宣言的に実装

  IntersectionObserver ベースの実装から、contentvisibilityautostatechange イベントと Context API を使用したより宣言的な実装に変更しました。

- Updated dependencies
  - cuin-analyzer@0.0.10

## 0.0.9

### Patch Changes

- Remove @cuin/schema from dependencies

  - @cuin/schema is now bundled into the CLI, so it doesn't need to be in dependencies
  - Moved to devDependencies for build-time type checking
  - Fixes "resource not found" error when installing from npm

## 0.0.8

### Patch Changes

- Fix schema bundling issue

  - Fixed tsdown config to correctly bundle @cuin/schema
  - Fixed external package name from @cuin/analyzer to cuin-analyzer
  - Prevents "resource not found" error when installing from npm

## 0.0.7

### Patch Changes

- Fix internal/external component detection for pnpm workspace with injected dependencies

  - Fixed issue where workspace packages in node_modules (due to pnpm `injected: true`) were incorrectly classified as external
  - Components from workspace packages are now correctly grouped together regardless of their physical location
  - External packages (e.g., jotai) are now correctly identified even when inside project root
