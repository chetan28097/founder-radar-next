import React from 'react';
import { Radar, ArrowRight, ShieldCheck, Sparkles, Database, Activity, GitBranch, CheckCircle2, Search } from 'lucide-react';
import { NavigationTab } from '../types';

interface LandingPageProps {
  onEnterApp: (tab?: NavigationTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        {/* Release / Status badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-indigo-300 mb-8 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Global Founder Discovery & Career Trajectory Intelligence</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
          Discover promising founders{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-purple-400">
            before the noise.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Uncover professionals moving into startup founder roles across global markets. 
          Reconstruct career progressions, inspect verified transition signals, and generate evidence-grounded research dossiers.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => onEnterApp('discover')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40"
          >
            <span>Launch Discovery Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEnterApp('overview')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-medium text-sm text-slate-300 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <span>Open Research Workspace</span>
          </button>
        </div>

        {/* Interactive Product Preview Card */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6 sm:p-8 max-w-4xl mx-auto shadow-2xl text-left relative group">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-500">live-search-preview.ts</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Crustdata + Claude via LiteLLM</span>
            </div>
          </div>

          <div className="bg-[#090c14] rounded-xl p-4 sm:p-5 border border-white/5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-indigo-400">TARGET QUERY:</span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  "Ex-Stripe leaders who transitioned into founder roles in San Francisco"
                </p>
              </div>
              <span className="self-start sm:self-center inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Sequential Transition</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block mb-1">Previous Role</span>
                <span className="text-slate-200 font-medium">Senior Staff Engineer, Stripe</span>
                <span className="text-slate-500 block mt-1">2019 – 2023 (4 yrs)</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block mb-1">Current Venture</span>
                <span className="text-indigo-300 font-medium">Co-Founder & CEO, CoreFlow AI</span>
                <span className="text-slate-500 block mt-1">2023 – Present</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block mb-1">Grounding Confidence</span>
                <span className="text-emerald-400 font-medium">100% Date-Backed Timeline</span>
                <span className="text-slate-500 block mt-1">No Hallucinations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Sections */}
      <section className="relative z-10 py-16 border-t border-white/5 bg-[#080b12]/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Global Signal Discovery</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter across countries, past employers (Stripe, Google, Meta, fintech leaders), job titles, and career milestones using Crustdata People Search.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Verified Trajectories</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strict separation of verified facts from hypotheses. Verified, unverified, and insufficient evidence statuses prevent deceptive hallucinations.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Traceable Observability</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Native Neatlogs telemetry captures search queries, profile normalization, Claude synthesis, and output validation into verifiable OpenInference traces.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-white/5 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Founder Radar · Neathacks 2026 Developer Build</span>
          <div className="flex items-center gap-4">
            <span>Entire Checkpoint Enabled</span>
            <span>·</span>
            <span>Neatlogs SDK v1.4.26</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
