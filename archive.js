'use strict';

// Index of all Claude Code chats from ~/.claude/projects/**/<sessionId>.jsonl.
// Pure fs, no deps. Results cached per-file by mtime so re-scans are cheap.

const fs = require('fs');
const os = require('os');
const path = require('path');

function claudeDir(d) { return d || path.join(os.homedir(), '.claude'); }

const cache = new Map(); // absPath -> { mtime, chat }

function decode(s) { try { return JSON.parse('"' + s + '"'); } catch (_e) { return s; } }
function grab(txt, re) { const m = txt.match(re); return m && m[1] ? decode(m[1]) : ''; }

function snippet(s) { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > 60 ? s.slice(0, 60) + '…' : s; }
function firstUserPrompt(txt) {
  for (const ln of txt.split(/\r?\n/)) {
    if (ln.indexOf('"type":"user"') === -1) continue;
    let j; try { j = JSON.parse(ln); } catch (_e) { continue; }
    if (j.type !== 'user' || !j.message) continue;
    const c = j.message.content;
    if (typeof c === 'string') { const t = snippet(c); if (t) return t; }
    else if (Array.isArray(c)) { const t = c.filter((x) => x && x.type === 'text').map((x) => x.text).join(' '); if (t.trim()) return snippet(t); }
  }
  return '';
}

function parseFile(file) {
  let st; try { st = fs.statSync(file); } catch (_e) { return null; }
  const hit = cache.get(file);
  if (hit && hit.mtime === st.mtimeMs) return hit.chat;
  let txt; try { txt = fs.readFileSync(file, 'utf8'); } catch (_e) { return null; }

  const sessionId = path.basename(file, '.jsonl');
  const cwd = grab(txt, /"cwd"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const title = grab(txt, /"aiTitle"\s*:\s*"((?:[^"\\]|\\.)*)"/)
    || (grab(txt, /"slug"\s*:\s*"((?:[^"\\]|\\.)*)"/) || '').replace(/-/g, ' ')
    || firstUserPrompt(txt)
    || ('chat ' + sessionId.slice(0, 8));

  const chat = {
    sessionId,
    cwd: cwd || '',
    repo: cwd ? path.basename(String(cwd).replace(/[\\/]+$/, '')) : '(unknown)',
    title,
    mtime: st.mtimeMs,
  };
  cache.set(file, { mtime: st.mtimeMs, chat });
  return chat;
}

/** All chats, newest first. (Top-level session files only; subagent traces live in a subfolder and are skipped.) */
function listChats(configDir) {
  const proj = path.join(claudeDir(configDir), 'projects');
  let dirs; try { dirs = fs.readdirSync(proj, { withFileTypes: true }).filter((d) => d.isDirectory()); } catch (_e) { return []; }
  const out = [];
  for (const d of dirs) {
    const sub = path.join(proj, d.name);
    let files; try { files = fs.readdirSync(sub).filter((f) => f.endsWith('.jsonl')); } catch (_e) { continue; }
    for (const f of files) { const c = parseFile(path.join(sub, f)); if (c) out.push(c); }
  }
  out.sort((a, b) => b.mtime - a.mtime);
  return out;
}

module.exports = { listChats };
