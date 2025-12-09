# @ikuma-t/cuin

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
