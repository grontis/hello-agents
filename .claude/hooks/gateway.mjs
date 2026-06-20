#!/usr/bin/env node
// Gateway pre-check for the pipeline slash commands, wired to the
// UserPromptExpansion hook in .claude/settings.json (matcher: implement|code-review|qa).
//
// It promotes the pipeline's "don't skip a stage" prose invariant into a real,
// deterministic gate: a command is BLOCKED before Claude ever sees it when the
// predecessor artifact is in the wrong state.
//
// Conservative + fail-open: it blocks ONLY unambiguous stage-skips and allows
// everything else (no active session, trivial direct-implement, fix cycles,
// unreadable state). A broken or uncertain check must never wedge the pipeline.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function readStdin() { try { return readFileSync(0, 'utf8'); } catch { return ''; } }
function allow() { process.exit(0); }
function block(reason) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(0);
}
function statusOf(path) {
  try {
    const m = readFileSync(path, 'utf8').match(/^\s*status:\s*([A-Za-z0-9_-]+)/m);
    return m ? m[1] : null;
  } catch { return null; }
}

try {
  const data = JSON.parse(readStdin() || '{}');
  const cmd = (data.command_name || '').toLowerCase();
  const projectDir = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
  const sessionPath = join(projectDir, '.agentwork', 'session.yaml');
  if (!existsSync(sessionPath)) allow(); // no active pipeline → never interfere

  const session = readFileSync(sessionPath, 'utf8');
  const pathFor = (key) => {
    const m = session.match(new RegExp(`${key}:\\s*(\\S+)`));
    if (!m || m[1] === '~' || m[1] === 'null') return null;
    return join(projectDir, m[1].replace(/^["']|["']$/g, ''));
  };

  const archPath = pathFor('architect');
  const coderPath = pathFor('coder');

  if (cmd === 'implement') {
    // Allow the trivial direct path (no plan) and fix cycles (changes-required).
    // Block only a plan that exists but isn't finalized.
    if (archPath) {
      const s = statusOf(archPath);
      if (s && s !== 'ready' && s !== 'changes-required') {
        block(`The architect plan is still '${s}', not 'ready'. Finalize the plan (select a solution) before /implement, or remove it to implement directly.`);
      }
    }
    allow();
  }

  if (cmd === 'code-review' || cmd === 'qa') {
    if (!coderPath) allow(); // nothing recorded yet → don't hard-block
    const s = statusOf(coderPath);
    if (s && s !== 'implemented') {
      block(`The coder's implementation summary is '${s}', not 'implemented'. Run /implement to completion before /${cmd}.`);
    }
    allow();
  }

  allow();
} catch { process.exit(0); } // fail-open
