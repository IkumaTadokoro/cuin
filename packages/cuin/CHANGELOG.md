# @ikuma-t/cuin

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
