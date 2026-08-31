#!/usr/bin/env node
// Reports a finished pipeline agent to the claude-worker that is hosting this
// session, wired to the SubagentStop hook in .claude/settings.json.
//
// The worker watches .agentwork/ on a timer anyway, so this hook is an
// accelerator and a disambiguator, not the source of truth: it says *which*
// agent stopped, which lets the worker resolve the right artifact immediately
// instead of waiting out a poll and guessing. The worker still reads the file
// off disk and reports what is actually written there — this hook cannot
// assert an outcome.
//
// Outside a worker (a plain editor session on a developer's machine) the
// environment is absent and this exits silently. Like every hook in this tree
// it is fail-open: a pipeline must never wedge because a notification failed.

import { readFileSync } from 'node:fs';

const TIMEOUT_MS = 2000;

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

async function main() {
  const url = process.env.CLAUDE_WORKER_STAGE_URL;
  const secret = process.env.CLAUDE_WORKER_CRED_SECRET;
  if (!url || !secret) return; // not running under claude-worker

  let payload = {};
  try {
    payload = JSON.parse(readStdin() || '{}');
  } catch {
    // A hook payload we cannot parse still tells us an agent stopped; the
    // worker can resolve the artifact from the armed stage without a name.
  }

  const body = JSON.stringify({
    agent: payload.subagent_type || payload.agent_type || payload.agent || '',
    sessionId: payload.session_id || '',
    reason: payload.reason || 'stop',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body,
      signal: controller.signal,
    });
  } catch {
    // Unreachable worker, timeout, DNS — none of it is the agent's problem.
  } finally {
    clearTimeout(timer);
  }
}

main().then(
  () => process.exit(0),
  () => process.exit(0),
);
