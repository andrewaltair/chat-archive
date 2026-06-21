# Changelog

## [0.5.0] — 2026-06-22

### Added
- **Reorder pinned chats** — drag a chat to move it, or right-click, "Move to top" / "Move to position..." to drop it at an exact spot (first, fifth, anything). The order is saved. Dragging an unpinned chat into the list pins it at that position. Unordered pinned chats fall to the bottom by recency.

## [0.4.0] — 2026-06-22

### Added
- **Rename a chat** — give any chat a custom name (inline pencil, or right-click, Rename chat). Display-only override stored locally; it never edits Claude's transcript, and the original title shows in the tooltip. Leave the box empty to restore the original.

## [0.3.4] — 2026-06-16

First public release.

### Features
- Sidebar archive of all Claude Code chats, grouped by repo, newest first; click to reopen any (by session id).
- Pin favourite chats to a group on top (persisted).
- Per-chat custom icon + color (one-click "Set icon & color", or set each separately; "Reset to default").
- Quick-pick search by title / repo.
- "Close Idle Chat Tabs" — close every chat tab except the active/pinned ones to free RAM; they stay in the archive.
- Pure local (reads `~/.claude/projects`, cached by mtime). No network, no telemetry.
