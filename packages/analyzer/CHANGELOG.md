# cuin-analyzer

## 0.3.0

## 0.2.2

## 0.2.0

## 0.1.0

## 0.0.20

## 0.0.19

## 0.0.18

### Patch Changes

- f8b3b4c: perf: optimize performance

## 0.0.17

### Patch Changes

- c42ac0f: chore: test OIDC release

## 0.0.16

### Patch Changes

- ebd7a73: ci: migrate to changesets-based release with OIDC

## 0.0.11

### Patch Changes

- - Migrate from SolidStart to Solid Router
  - Add URL sync for filter conditions
  - Add package filter feature
  - Minor fixes

## 0.0.10

### Patch Changes

- contentvisibilityautostatechange と Context で遅延ハイライトを宣言的に実装

  IntersectionObserver ベースの実装から、contentvisibilityautostatechange イベントと Context API を使用したより宣言的な実装に変更しました。

## 0.0.7

### Patch Changes

- Fix internal/external component detection for pnpm workspace with injected dependencies

  - Fixed issue where workspace packages in node_modules (due to pnpm `injected: true`) were incorrectly classified as external
  - Components from workspace packages are now correctly grouped together regardless of their physical location
  - External packages (e.g., jotai) are now correctly identified even when inside project root
