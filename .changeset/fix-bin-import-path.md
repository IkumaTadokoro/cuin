---
"@ikuma-t/cuin": patch
---

Fix ERR_MODULE_NOT_FOUND error when running pnpx @ikuma-t/cuin. The bin.mjs was trying to import ./dist/index.js, but tsdown actually outputs ./dist/index.mjs. This mismatch caused the published package to fail on execution.
