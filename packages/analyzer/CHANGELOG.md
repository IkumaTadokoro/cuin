# cuin-analyzer

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
