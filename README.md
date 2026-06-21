<div align="center">

<img src="https://raw.githubusercontent.com/andrewaltair/chat-archive/main/icon.png" width="120" alt="Claude Chat Archive" />

# Claude Chat Archive

**Browse, reopen, pin, color and icon every Claude Code chat — from a sidebar. Close idle tabs to free RAM.**

[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/andrewaltair.chat-archive?style=flat-square&label=Marketplace&color=1f6feb)](https://marketplace.visualstudio.com/items?itemName=andrewaltair.chat-archive)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/andrewaltair.chat-archive?style=flat-square&color=2ea043)](https://marketplace.visualstudio.com/items?itemName=andrewaltair.chat-archive)
[![License: MIT](https://img.shields.io/github/license/andrewaltair/chat-archive?style=flat-square&color=8957e5)](LICENSE)

<img src="https://raw.githubusercontent.com/andrewaltair/chat-archive/main/docs/screenshot.png" width="820" alt="The Chat Archive sidebar" />

</div>

---

Claude Code already saves every chat as a transcript in `~/.claude/projects`. This extension turns those into a browsable archive so you can keep just a few chats open (RAM) and jump back to any of the others on demand.

## Features

- 🗂 **Sidebar archive** — every chat, grouped by repo, newest first, labeled by its title. Click to open.
- 🔁 **Reopen anything** — opens the exact chat by session id (via Claude's own deep link), even one closed long ago.
- ✏️ **Rename** any chat to a custom name (local override, never edits Claude's transcript; original stays in the tooltip).
- 📌 **Pin** favourites to a group on top (persists across reloads).
- 🎨 **Color & icon** each chat — one click sets a custom icon and a color so you can tell them apart at a glance.
- 🔍 **Quick-pick search** — `Search & Open a Chat`, type by title or repo.
- 🧹 **Close Idle Chat Tabs** — closes every chat tab except the active/pinned ones to free RAM; they stay in the archive.

## How it works

Pure local: reads `~/.claude/projects/**/*.jsonl` (cached by mtime) for titles, repos and dates. Opening a chat calls Claude Code's `vscode://anthropic.claude-code/open?session=<id>` deep link. No network, no telemetry.

## Use

- Open the **Chat Archive** view in the activity bar (left).
- Hover a chat: **✏️ rename** · **📌 pin** · **🎨 set icon & color**. Right-click for `Rename chat` / `Set icon` / `Set color` / `Reset to default`.
- Toolbar (view title): **🔍 search** · **✖ close idle tabs** · **⟳ refresh**.

## Settings
- `chatArchive.claudeConfigDir` — override `~/.claude`.

## Install

From the Marketplace (search **“Claude Chat Archive”**) or:
```
ext install andrewaltair.chat-archive
```
Or grab the `.vsix` from [Releases](https://github.com/andrewaltair/chat-archive/releases) → Extensions → **⋯ → Install from VSIX…**.

## License

[MIT](LICENSE) © Andrew Altair
