---
"@ikuma-t/cuin": minor
"@ikuma-t/cuin-analyzer": patch
---

Add UsedBy package filter and fix package type detection

Added a new UsedBy package filter to the component list page that allows users to filter components based on which packages use them. The filter displays packages with usage counts and updates the component list dynamically.

Fixed two package type detection issues:
1. Same packages appearing as duplicates with different internal/external types - now merged using MergedPackageKey with internal-priority icon display
2. Instance packages showing incorrect types - now correctly determined based on usage location rather than component source location
