#!/usr/bin/env node
// Auto-maintains .agentwork/progress-log.md from the SubagentStart / SubagentStop
// hooks declared in .claude/settings.json. Replaces the old "agents log manually"
// convention so the audit trail can never be forgotten or double-written.
//
// Invoked as:  node progress-log.mjs <start|stop>
// Fail-open by design: any error exits 0 so logging never blocks the pipeline.
import { readFileSync, existsSync, mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const TRACKED = ['architect', 'architect-deep', 'coder', 'code-reviewer', 'qa'];
const action = process.argv[2] === 'start' ? 'Started' : 'Completed';

function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

try {
  let data = {};
  try { data = JSON.parse(readStdin()); } catch { /* ignore malformed input */ }

  const agent = data.agent_type || data.subagent_type || data.agent_name || data.name;
  if (!agent || !TRACKED.includes(agent)) process.exit(0); // only our pipeline agents

  const projectDir = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
  const dir = join(projectDir, '.agentwork');
  const file = join(dir, 'progress-log.md');

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(file)) {
    writeFileSync(
      file,
      '| Timestamp | Agent | Action | Outcome | Details |\n' +
      '|-----------|-------|--------|---------|---------|\n'
    );
  }

  const ts = new Date().toISOString();
  appendFileSync(file, `| ${ts} | ${agent} | ${action} | — | auto-logged by hook |\n`);
} catch { /* fail-open */ }

process.exit(0);
