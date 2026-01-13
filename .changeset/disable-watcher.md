---
"@ikuma-t/cuin": minor
---

Temporarily disable file watcher to avoid EMFILE errors on large projects

**Breaking Changes:**
- Removed `--watch` option from dev command
- Automatic re-analysis on file changes no longer works
- Users must reload the browser to see latest analysis results

**Background:**
When analyzing large projects, the file watcher would exceed the OS file descriptor limit, causing "EMFILE: too many open files" errors. After trying multiple approaches (glob patterns, polling mode, event filtering), we decided to temporarily disable the watcher feature to ensure reliable operation.

**Workaround:**
Reload the browser to see the latest analysis results after making file changes.

**Future improvements:**
- Explore more efficient file watching methods
- Add option to specify directories to watch
- Document how to increase system file descriptor limits
