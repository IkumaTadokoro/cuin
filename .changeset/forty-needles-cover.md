---
"@ikuma-t/cuin": patch
---

fix: move UI dependencies to devDependencies to reduce install size

- Move SolidJS, Shiki, Ark UI and other UI packages to devDependencies
- UI is bundled at build time, so runtime dependencies are not required
- Extract dist directory resolution logic to shared module
