---
"@ikuma-t/cuin": minor
---

Add file watching with real-time analysis updates

- Add file watcher using chokidar to detect changes in analyzed directory
- Implement Server-Sent Events (SSE) for real-time communication between server and UI
- Add visual status indicators in UI for analysis progress
- Support `--watch` flag (enabled by default) to toggle file watching
- Auto-refetch data in UI when analysis completes
- Add proper cleanup on SIGINT signal
