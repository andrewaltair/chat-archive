'use strict';

const vscode = require('vscode');
const { listChats } = require('./archive');

let provider;
let gstate; // globalState — persists pinned chats + per-chat icon/color

function configDir() { return vscode.workspace.getConfiguration('chatArchive').get('claudeConfigDir', '') || undefined; }
function pinnedSet() { return new Set(gstate ? (gstate.get('chatArchive.pinned', []) || []) : []); }
function savePinned(set) { if (gstate) gstate.update('chatArchive.pinned', [...set]); }

// ---- per-chat custom name (display-only override; never edits Claude's transcript) ----
function allTitles() { return gstate ? (gstate.get('chatArchive.titles', {}) || {}) : {}; }
function saveTitles(o) { if (gstate) gstate.update('chatArchive.titles', o); }
function titleFor(s, fallback) { const t = allTitles()[s]; return (t && t.trim()) ? t : fallback; }
async function renameChat(node) {
  const s = node && node.sessionId; if (!s) return;
  const cur = allTitles()[s] || node.title || '';
  const v = await vscode.window.showInputBox({
    title: 'Rename chat', value: cur, valueSelection: [0, cur.length],
    prompt: 'Custom name shown in the archive (leave empty to restore the original).',
  });
  if (v === undefined) return; // cancelled
  const all = allTitles();
  if (v.trim()) all[s] = v.trim(); else delete all[s];
  saveTitles(all);
  provider.refresh();
}

function fmtDate(ms) {
  const d = new Date(ms);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toTimeString().slice(0, 5);
  if (Date.now() - ms < 7 * 86400000) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] + ' ' + d.toTimeString().slice(0, 5);
  return d.toISOString().slice(0, 10);
}

async function openChat(arg) {
  const sessionId = (arg && arg.sessionId) ? arg.sessionId : arg; // tree node or raw id
  if (!sessionId) return;
  try { await vscode.commands.executeCommand('claude-vscode.primaryEditor.open', sessionId); }
  catch (_e) { await vscode.env.openExternal(vscode.Uri.parse('vscode://anthropic.claude-code/open?session=' + sessionId)); }
}

function pin(node) { const s = node && node.sessionId; if (!s) return; const p = pinnedSet(); p.add(s); savePinned(p); provider.refresh(); }
function unpin(node) { const s = node && node.sessionId; if (!s) return; const p = pinnedSet(); p.delete(s); savePinned(p); provider.refresh(); }

// ---- per-chat icon + color (persisted) ----
const ICONS = [
  { id: 'comment-discussion', name: 'Chat (default)' }, { id: 'star-full', name: 'Star' }, { id: 'flame', name: 'Flame' },
  { id: 'rocket', name: 'Rocket' }, { id: 'bug', name: 'Bug' }, { id: 'beaker', name: 'Experiment' },
  { id: 'heart', name: 'Heart' }, { id: 'tag', name: 'Tag' }, { id: 'bookmark', name: 'Bookmark' },
  { id: 'zap', name: 'Zap' }, { id: 'gift', name: 'Gift' }, { id: 'target', name: 'Target' },
  { id: 'lightbulb', name: 'Idea' }, { id: 'package', name: 'Package' }, { id: 'tools', name: 'Tools' },
  { id: 'gear', name: 'Gear' }, { id: 'check-all', name: 'Done' }, { id: 'eye', name: 'Watch' },
];
const COLORS = [
  { id: '', name: 'Default (no color)' }, { id: 'terminal.ansiRed', name: 'Red' }, { id: 'terminal.ansiYellow', name: 'Yellow' },
  { id: 'terminal.ansiGreen', name: 'Green' }, { id: 'terminal.ansiBlue', name: 'Blue' }, { id: 'terminal.ansiMagenta', name: 'Magenta' },
  { id: 'terminal.ansiCyan', name: 'Cyan' },
];

function allStyles() { return gstate ? (gstate.get('chatArchive.style', {}) || {}) : {}; }
function saveStyles(o) { if (gstate) gstate.update('chatArchive.style', o); }
function styleFor(s) { return allStyles()[s] || {}; }
function updateStyle(s, fn) { const all = allStyles(); const st = all[s] || {}; fn(st); if (!st.icon && !st.color) delete all[s]; else all[s] = st; saveStyles(all); }

async function setIcon(node) {
  const s = node && node.sessionId; if (!s) return;
  const pick = await vscode.window.showQuickPick(ICONS.map((i) => ({ label: '$(' + i.id + ') ' + i.name, id: i.id })), { title: 'Chat icon', placeHolder: 'pick an icon' });
  if (!pick) return;
  updateStyle(s, (st) => { st.icon = pick.id === 'comment-discussion' ? undefined : pick.id; });
  provider.refresh();
}
async function setColor(node) {
  const s = node && node.sessionId; if (!s) return;
  const items = COLORS.map((c) => ({
    label: c.name,
    iconPath: new vscode.ThemeIcon(c.id ? 'circle-large-filled' : 'circle-large-outline', c.id ? new vscode.ThemeColor(c.id) : undefined),
    id: c.id,
  }));
  const pick = await vscode.window.showQuickPick(items, { title: 'Chat color', placeHolder: 'pick a color' });
  if (!pick) return;
  updateStyle(s, (st) => { st.color = pick.id || undefined; });
  provider.refresh();
}
function clearStyle(node) { const s = node && node.sessionId; if (!s) return; updateStyle(s, (st) => { st.icon = undefined; st.color = undefined; }); provider.refresh(); }
// one button: pick an icon, then pick a color
async function styleChat(node) { await setIcon(node); await setColor(node); }

// ---- sidebar tree: 📌 Pinned + repos -> chats ----
class ChatTree {
  constructor() { this._e = new vscode.EventEmitter(); this.onDidChangeTreeData = this._e.event; this.chats = null; }
  refresh() { this.chats = listChats(configDir()); this._e.fire(); }
  getTreeItem(el) { return el.item; }
  getChildren(el) {
    if (this.chats === null) this.chats = listChats(configDir());
    if (!el) {
      const pin = pinnedSet();
      const pinned = this.chats.filter((c) => pin.has(c.sessionId));
      const rest = this.chats.filter((c) => !pin.has(c.sessionId));
      const nodes = [];
      if (pinned.length) {
        const g = new vscode.TreeItem('Pinned', vscode.TreeItemCollapsibleState.Expanded);
        g.iconPath = new vscode.ThemeIcon('pinned');
        g.description = String(pinned.length);
        nodes.push({ item: g, chats: pinned, pinned: true });
      }
      const byRepo = new Map();
      for (const c of rest) { if (!byRepo.has(c.repo)) byRepo.set(c.repo, []); byRepo.get(c.repo).push(c); }
      for (const [repo, chats] of [...byRepo.entries()].sort((a, b) => b[1][0].mtime - a[1][0].mtime)) {
        const it = new vscode.TreeItem(repo, vscode.TreeItemCollapsibleState.Expanded);
        it.description = String(chats.length);
        it.iconPath = new vscode.ThemeIcon('repo');
        nodes.push({ item: it, chats });
      }
      return nodes;
    }
    if (el.chats) return el.chats.map((c) => chatNode(c, !!el.pinned));
    return [];
  }
}

function chatNode(c, isPinned) {
  const shown = titleFor(c.sessionId, c.title || '(untitled)');
  const renamed = shown !== (c.title || '(untitled)');
  const it = new vscode.TreeItem(shown, vscode.TreeItemCollapsibleState.None);
  it.description = fmtDate(c.mtime);
  it.tooltip = shown + (renamed ? '\n(original: ' + (c.title || 'untitled') + ')' : '') + '\n' + c.cwd + '\n' + new Date(c.mtime).toLocaleString();
  const st = styleFor(c.sessionId);
  it.iconPath = new vscode.ThemeIcon(st.icon || 'comment-discussion', st.color ? new vscode.ThemeColor(st.color) : undefined);
  it.command = { command: 'chatArchive.open', title: 'Open chat', arguments: [c.sessionId] };
  it.contextValue = isPinned ? 'chatPinned' : 'chatUnpinned';
  return { item: it, sessionId: c.sessionId, title: c.title || '' };
}

// ---- quick-pick search (pinned first) ----
async function searchChats() {
  const chats = listChats(configDir());
  if (!chats.length) { vscode.window.showInformationMessage('Chat Archive: no chats found under ~/.claude/projects.'); return; }
  const pin = pinnedSet();
  const ordered = [...chats.filter((c) => pin.has(c.sessionId)), ...chats.filter((c) => !pin.has(c.sessionId))];
  const pick = await vscode.window.showQuickPick(
    ordered.map((c) => ({ label: (pin.has(c.sessionId) ? '$(pinned) ' : '$(comment-discussion) ') + titleFor(c.sessionId, c.title || '(untitled)'), description: c.repo, detail: fmtDate(c.mtime), s: c.sessionId })),
    { title: 'Open a chat from the archive', matchOnDescription: true, matchOnDetail: true, placeHolder: 'search by title / repo' }
  );
  if (pick) openChat(pick.s);
}

// ---- close idle chat tabs to free RAM ----
async function closeOthers() {
  const groups = vscode.window.tabGroups;
  const active = groups.activeTabGroup && groups.activeTabGroup.activeTab;
  const toClose = [];
  for (const g of groups.all) {
    for (const t of g.tabs) {
      if (t === active || t.isPinned) continue;
      const inp = t.input;
      if (inp instanceof vscode.TabInputWebview && String(inp.viewType).includes('claudeVSCodePanel')) toClose.push(t);
    }
  }
  if (!toClose.length) { vscode.window.showInformationMessage('Chat Archive: no other chat tabs to close.'); return; }
  const ok = await vscode.window.showWarningMessage('Close ' + toClose.length + ' chat tab(s)? They stay in the archive.', { modal: true }, 'Close');
  if (ok !== 'Close') return;
  await groups.close(toClose);
  vscode.window.showInformationMessage('Closed ' + toClose.length + ' chat tab(s) — RAM freed. Reopen from the archive anytime.');
}

function activate(context) {
  gstate = context.globalState;
  provider = new ChatTree();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('chatArchiveView', provider),
    vscode.commands.registerCommand('chatArchive.open', openChat),
    vscode.commands.registerCommand('chatArchive.search', searchChats),
    vscode.commands.registerCommand('chatArchive.closeOthers', closeOthers),
    vscode.commands.registerCommand('chatArchive.refresh', () => provider.refresh()),
    vscode.commands.registerCommand('chatArchive.pin', pin),
    vscode.commands.registerCommand('chatArchive.unpin', unpin),
    vscode.commands.registerCommand('chatArchive.rename', renameChat),
    vscode.commands.registerCommand('chatArchive.setIcon', setIcon),
    vscode.commands.registerCommand('chatArchive.setColor', setColor),
    vscode.commands.registerCommand('chatArchive.clearStyle', clearStyle),
    vscode.commands.registerCommand('chatArchive.style', styleChat),
  );

  // chats live only in the left sidebar (no status-bar button — that space is for Folders)
  let t;
  context.subscriptions.push(
    vscode.window.tabGroups.onDidChangeTabs(() => { clearTimeout(t); t = setTimeout(() => provider.refresh(), 800); }),
  );

  provider.refresh();
}

function deactivate() {}

module.exports = { activate, deactivate };
