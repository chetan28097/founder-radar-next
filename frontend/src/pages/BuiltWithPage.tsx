import React from 'react';
import { OutLink, PageHeader } from '../components/ui';

/*
  NeatHack tools showcase. Every claim on this page is tied to evidence in the repository,
  the public Entire project page, or captured session transcripts. Status wording is
  deliberately narrow: configured is not the same as delivered.
*/

type StatusTone = 'ok' | 'warn' | 'muted';

const Status: React.FC<{ tone: StatusTone; children: React.ReactNode }> = ({ tone, children }) => (
  <span
    className={`inline-flex rounded-[4px] px-1.5 py-px text-[12px] font-medium ${
      tone === 'ok' ? 'bg-ok-soft text-ok' : tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-muted-soft text-ink-2'
    }`}
  >
    {children}
  </span>
);

const Figure: React.FC<{ src: string; alt: string; caption: React.ReactNode }> = ({ src, alt, caption }) => (
  <figure className="overflow-hidden rounded-lg border border-line">
    <a href={src} target="_blank" rel="noopener noreferrer" title="Open full size">
      <img src={src} alt={alt} loading="lazy" className="block w-full bg-[#171717]" />
    </a>
    <figcaption className="border-t border-line bg-surface-2/60 px-3.5 py-2.5 text-[13px] text-ink-2">{caption}</figcaption>
  </figure>
);

const Excerpt: React.FC<{ label: string; caption: React.ReactNode; children: string }> = ({ label, caption, children }) => (
  <figure className="overflow-hidden rounded-lg border border-line">
    <div className="border-b border-line bg-surface-2/60 px-3.5 py-1.5 text-[12px] font-medium text-ink-3">{label}</div>
    <pre className="overflow-x-auto bg-surface px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-ink-2">{children}</pre>
    <figcaption className="border-t border-line bg-surface-2/60 px-3.5 py-2.5 text-[13px] text-ink-2">{caption}</figcaption>
  </figure>
);

const ToolSection: React.FC<{
  id: string;
  name: string;
  tagline: string;
  status: { tone: StatusTone; label: string }[];
  did: React.ReactNode;
  facts: React.ReactNode[];
  children: React.ReactNode;
}> = ({ id, name, tagline, status, did, facts, children }) => (
  <section id={id} aria-labelledby={`${id}-h`} className="grid grid-cols-1 gap-6 border-t border-line py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
    <div>
      <h2 id={`${id}-h`} className="text-[24px] font-semibold text-ink">
        {name}
      </h2>
      <p className="mt-1 text-[15px] text-ink-3">{tagline}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {status.map((s) => (
          <Status key={s.label} tone={s.tone}>
            {s.label}
          </Status>
        ))}
      </div>
      <div className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-ink-2">{did}</div>
      <ul className="mt-4 space-y-1.5 text-[14px] text-ink-2">
        {facts.map((f, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="min-w-0 space-y-4">{children}</div>
  </section>
);

export const BuiltWithPage: React.FC = () => (
  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <PageHeader
      title="How Founder Radar was built"
      description="Three NeatHacks tools were part of building Founder Radar. Each section says what the tool did, shows the evidence, and states what that evidence does and does not prove."
    />

    <nav aria-label="Tools on this page" className="flex flex-wrap gap-2 py-5 text-[14px]">
      {[
        ['#entire', 'Entire'],
        ['#neatlogs', 'Neatlogs'],
        ['#cfoai', 'cfo.ai'],
      ].map(([href, label]) => (
        <a
          key={href}
          href={href}
          onClick={(e) => {
            e.preventDefault();
            document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="rounded-md border border-line px-3 py-1 text-ink-2 hover:border-line-strong hover:text-ink"
        >
          {label}
        </a>
      ))}
    </nav>

    <ToolSection
      id="entire"
      name="Entire"
      tagline="Records AI coding sessions and ties them to Git commits as checkpoints."
      status={[
        { tone: 'ok', label: 'Checkpoint recorded' },
        { tone: 'ok', label: 'Session published' },
      ]}
      did={
        <p>
          Entire was enabled on the repository with the Antigravity and Claude Code agents. It captured the Antigravity
          session that built the core platform and published it as a checkpoint linked to a commit, so the prompt and every
          agent step behind that code can be reviewed.
        </p>
      }
      facts={[
        <>8 commits on <code className="font-mono text-[13px]">main</code>, dated 11 Oct 2026.</>,
        <>
          1 checkpoint (<code className="font-mono text-[13px]">01M4NRF1…QZZ6K6</code>) on commit{' '}
          <code className="font-mono text-[13px]">7eaa2cb</code>, from Antigravity session{' '}
          <code className="font-mono text-[13px]">9e9322d5</code>.
        </>,
        'The checkpoint stores the full transcript: 538 agent steps across 17 internal save points.',
        'Later Claude Code sessions were captured locally but created no checkpoint, because they changed no files.',
      ]}
    >
      <Figure
        src="/evidence/entire-commits.png"
        alt="Entire commits page for chetan28097/founder-radar-next listing 8 commits on main, with 1 checkpoint on commit 7eaa2cb"
        caption={
          <>
            Public Entire commits page, captured 12 Oct 2026. Shows all 8 commits and the one commit with a checkpoint.{' '}
            <OutLink href="https://entire.io/gh/chetan28097/founder-radar-next/commits">View live</OutLink>
          </>
        }
      />
      <Figure
        src="/evidence/entire-sessions.png"
        alt="Entire sessions page showing one Antigravity session named Founder Radar AI Discovery Platform with 1 checkpoint"
        caption="Entire sessions page. The single published session is the Antigravity build session, linked to one checkpoint."
      />
    </ToolSection>

    <ToolSection
      id="neatlogs"
      name="Neatlogs"
      tagline="Traces LLM applications and AI coding sessions."
      status={[
        { tone: 'ok', label: 'App traces received' },
        { tone: 'ok', label: 'Claude Code session traces received' },
        { tone: 'muted', label: 'LLM cost not attributed for app calls' },
      ]}
      did={
        <>
          <p>Neatlogs was used in two places:</p>
          <p className="mt-2">
            <span className="font-medium text-ink">In the product</span>, the backend starts the Neatlogs SDK with LiteLLM
            instrumentation and wraps each step of a search, dossier load or research run in a named span. Those traces
            arrive in the founder-radar workflow.
          </p>
          <p className="mt-2">
            <span className="font-medium text-ink">During development</span>, the Neatlogs Claude Code hooks trace coding
            sessions. They first failed because the hook command was not on PATH. After it was pointed at its full path on
            12 Oct 2026, the redesign session's tool calls began appearing in Neatlogs.
          </p>
        </>
      }
      facts={[
        '94 traces in the founder-radar workflow; 105 traces in the project overall as of 12 Oct 2026.',
        <>
          Spans seen in the dashboard: <code className="font-mono text-[13px]">incoming_search_request</code>,{' '}
          <code className="font-mono text-[13px]">crustdata_fetch</code>,{' '}
          <code className="font-mono text-[13px]">profile_normalization</code> (48 sessions),{' '}
          <code className="font-mono text-[13px]">profile_dossier_retrieval</code>,{' '}
          <code className="font-mono text-[13px]">founder_research_analysis</code>,{' '}
          <code className="font-mono text-[13px]">ai_synthesis</code> (12 sessions).
        </>,
        'Claude Code tool calls traced: Edit 50, Write 27, PowerShell 26, Read 24, Grep 7, Bash 5.',
        'App traces show $0 and 0 tokens, so token and cost capture for the LiteLLM calls is not confirmed. Recorded cost comes from the Claude Code session model.',
      ]}
    >
      <Figure
        src="/evidence/neatlogs-arc-patterns.png"
        alt="Neatlogs arc patterns for the founder-radar workflow: incoming search and crustdata fetch flowing into profile normalization, and profile dossier and founder research flowing into ai synthesis"
        caption="Execution flow across founder-radar traces. These are the spans defined in the backend, received by Neatlogs."
      />
      <Figure
        src="/evidence/neatlogs-trace-comparison.png"
        alt="Neatlogs trace comparison table listing 20 recent founder-radar runs on 12 Oct with durations and OK status"
        caption="Recent founder-radar runs (94 in the workflow), all OK. By duration, the multi-second runs are most likely Crustdata searches and the millisecond runs cached dossier loads."
      />
      <Figure
        src="/evidence/neatlogs-tool-performance.png"
        alt="Neatlogs tool performance table with Claude Code tools Edit, Write, PowerShell, Read, Grep, Bash and TaskStop"
        caption="Claude Code tool calls from the redesign session, traced after the hook fix. The Bash errors are commands blocked by Claude Code's permission classifier."
      />
      <Excerpt
        label="Claude Code session output before the fix, 12 Oct 2026 (captured by Entire)"
        caption="Why earlier Claude Code sessions have no traces: the hook command could not be found."
      >{`SessionEnd hook [neatlogs-claude-code hook] failed:
/usr/bin/bash: line 1: neatlogs-claude-code: command not found`}</Excerpt>
    </ToolSection>

    <ToolSection
      id="cfoai"
      name="cfo.ai"
      tagline="An AI finance workspace that Claude can read and edit through MCP."
      status={[
        { tone: 'ok', label: 'Used during development' },
        { tone: 'muted', label: 'Not integrated into the product' },
      ]}
      did={
        <p>
          The cfo.ai MCP server was connected to Claude Code by following cfo.ai's official setup guide, then authenticated in
          the browser. Claude then made read-only calls to a 12-month Founder Radar operating model in the team's cfo.ai
          workspace, to check whether the product's costs could be sustained. Nothing was written to cfo.ai. Inside the
          product, financial diligence is still marked Coming soon.
        </p>
      }
      facts={[
        <>
          Tools called: <code className="font-mono text-[13px]">list_orgs</code>,{' '}
          <code className="font-mono text-[13px]">inspect_pages</code>,{' '}
          <code className="font-mono text-[13px]">inspect_table_blocks</code>,{' '}
          <code className="font-mono text-[13px]">inspect_integrations</code>.
        </>,
        'Model read: 5 pages and 12 tables, in INR, Oct 2026 to Sep 2027, with Main, Downside, Upside and "Credits expire" scenarios.',
        'No data sources are connected in cfo.ai, so every figure comes from typed assumptions, not real data.',
      ]}
    >
      <Figure
        src="/evidence/cfoai-scenario-summary.png"
        alt="cfo.ai scenario decision summary comparing Main, Downside, Upside and Credits expire scenarios for twelve-month revenue, operating result, final cash and minimum cash"
        caption="Scenario decision summary in app.cfo.ai. Every scenario hits its first cash shortfall in month 1. The values match what Claude read through the MCP tools. They are planning assumptions, not actual results."
      />
      <Figure
        src="/evidence/cfoai-operating-model.png"
        alt="cfo.ai Founder Radar operating model, monthly forecast at a glance by quarter from Q4-26 to Q3-27"
        caption="Quarterly view of the operating model. The upfront cfo.ai subscription payment (₹382,500 in Q4-26) is what pushes ending cash negative until Q2-27."
      />
      <Excerpt
        label="cfo.ai MCP calls, 12 Oct 2026 (session captured by Entire)"
        caption="Read-only tool calls Claude made against the workspace. No write tools were used."
      >{`mcp__cfoai__list_orgs            -> 1 org, role: admin
mcp__cfoai__inspect_pages        -> 5 pages, 21 blocks
mcp__cfoai__inspect_table_blocks -> 12 tables listed, 8 read in full
mcp__cfoai__inspect_integrations -> no integrations set up`}</Excerpt>
    </ToolSection>
  </div>
);
