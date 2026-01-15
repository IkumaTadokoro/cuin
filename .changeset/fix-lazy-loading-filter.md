---
"@ikuma-t/cuin": patch
---

Fix lazy loading stopping at 100 items when filters are changed

Previously, when users changed filters on the component detail page, the lazy loading would stop at 100 items even when more filtered results were available. This occurred because the `addMore` function was only called in `onMount`, which executes once on initial mount.

Fixed by moving the `addMore` function outside of `onMount` and calling it within `createEffect`, ensuring lazy loading restarts automatically whenever the filtered instances change.
