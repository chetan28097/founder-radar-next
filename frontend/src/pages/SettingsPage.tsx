import React, { useState, useEffect } from 'react';
import {
  Activity, CheckCircle2, AlertTriangle, RefreshCw,
  Database, Cpu, ShieldCheck, GitBranch, Layers, Sparkles
} from 'lucide-react';
import { HealthResponse } from '../types';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await api.getHealth();
      setHealth(res);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System & Integration Status</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time diagnostics and integration health for Founder Radar local services.
          </p>
        </div>

        <button
          onClick={checkStatus}
          disabled={checking}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 transition-colors flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Run Diagnostic Ping</span>
        </button>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Crustdata */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Crustdata People Search</h3>
                <span className="text-xs text-slate-400 font-mono">v2025-11-01</span>
              </div>
            </div>
            {health?.crustdata_connected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/40 border border-rose-500/30 text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Unreachable</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Powers candidate discovery and employment history retrieval via https://api.crustdata.com/person/search.
          </p>
          <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 font-mono">
            Key: Configured via secure backend .env
          </div>
        </div>

        {/* LiteLLM & Claude */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Claude via LiteLLM Gateway</h3>
                <span className="text-xs text-slate-400 font-mono">{health?.model_id || 'claude-sonnet-4.6'}</span>
              </div>
            </div>
            {health?.litellm_connected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/40 border border-rose-500/30 text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Check Gateway</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Performs grounded profile dossier synthesis, gap analysis, and tailored outreach drafting.
          </p>
          <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 font-mono">
            Gateway: https://litellm.vision.aivar.app
          </div>
        </div>

        {/* Neatlogs */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Neatlogs Telemetry SDK</h3>
                <span className="text-xs text-slate-400 font-mono">Workflow: founder-radar</span>
              </div>
            </div>
            {health?.neatlogs_connected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active & Exporting</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/40 border border-amber-500/30 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Check Ingestion</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Captures search execution, normalization spans, model invocations, and readbacks via OTLP/HTTP.
          </p>
          <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 font-mono">
            Doctor Diagnostics: Verified pass v2
          </div>
        </div>

        {/* Entire CLI Hackathon Tooling */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Entire Hackathon Tooling</h3>
                <span className="text-xs text-slate-400 font-mono">Agent: Antigravity</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tracked</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Local session capture and checkpoint creation enabled for Neathacks 2026.
          </p>
          <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 font-mono">
            Repo: chetan28097/founder-radar-next
          </div>
        </div>

        {/* SQLite Database */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Local SQLite Database</h3>
                <span className="text-xs text-slate-400 font-mono">founder_radar.db</span>
              </div>
            </div>
            {health?.database_connected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Operational</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/40 border border-rose-500/30 text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Error</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Persistent local storage for user-created watchlists, saved founders, research notes, and search history.
          </p>
          <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 font-mono">
            Driver: Python 3.13 sqlite3 standard
          </div>
        </div>

        {/* CFO.AI - Deferred */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-3 opacity-75">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-300">cfo.ai Financial Diligence</h3>
                <span className="text-xs text-slate-500 font-mono">Modular Slot</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400">
              <span>Coming Soon</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Financial modeling and cap-table diligence architecture prepared. Deferred for post-hackathon build.
          </p>
          <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 font-mono">
            Status: Deferred per master specification
          </div>
        </div>
      </div>
    </div>
  );
};
