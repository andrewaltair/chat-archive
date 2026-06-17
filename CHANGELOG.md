# Changelog

## [0.3.4] — 2026-06-16

First public release.

### Features
- Sidebar archive of all Claude Code chats, grouped by repo, newest first; click to reopen any (by session id).
- Pin favourite chats to a group on top (persisted).
- Per-chat custom icon + color (one-click "Set icon & color", or set each separately; "Reset to default").
- Quick-pick search by title / repo.
- "Close Idle Chat Tabs" — close every chat tab except the active/pinned ones to free RAM; they stay in the archive.
- Pure local (reads `~/.claude/projects`, cached by mtime). No network, no telemetry.
