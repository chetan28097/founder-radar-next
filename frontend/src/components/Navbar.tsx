import React from 'react';
import { Radar, Sparkles, Activity, Menu, X } from 'lucide-react';
import { NavigationTab } from '../types';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#07090e]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('landing')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-600/20 group-hover:shadow-indigo-500/30 transition-shadow">
            <div className="w-full h-full bg-[#090c15] rounded-[11px] flex items-center justify-center">
              <Radar className="w-5 h-5 text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-white">Founder Radar</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold">
                Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Center / Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onSelectTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'overview'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectTab('discover')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'discover'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Discover Founders
          </button>
          <button
            onClick={() => onSelectTab('watchlists')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'watchlists'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Watchlists
          </button>
          <button
            onClick={() => onSelectTab('research')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'research'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Research Workspace
          </button>
        </nav>

        {/* Right Info: Telemetry indicator & Settings */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Neatlogs Active</span>
          </div>

          <button
            onClick={() => onSelectTab('settings')}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
              currentTab === 'settings'
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title="Settings & System Health"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#07090e] px-4 pt-2 pb-4 space-y-1">
          <button
            onClick={() => {
              onSelectTab('overview');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg"
          >
            Overview
          </button>
          <button
            onClick={() => {
              onSelectTab('discover');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg"
          >
            Discover Founders
          </button>
          <button
            onClick={() => {
              onSelectTab('watchlists');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg"
          >
            Watchlists
          </button>
          <button
            onClick={() => {
              onSelectTab('research');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg"
          >
            Research Workspace
          </button>
          <button
            onClick={() => {
              onSelectTab('settings');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg"
          >
            Settings & Integrations
          </button>
        </div>
      )}
    </header>
  );
};
