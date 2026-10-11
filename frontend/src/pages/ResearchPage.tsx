import React, { useState, useEffect } from 'react';
import { Sparkles, Search, MessageSquare, Mail, Copy, Check, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { SavedFounder, ResearchResponse, FounderProfile } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface ResearchPageProps {
  onOpenDossier: (profileId: string) => void;
}

export const ResearchPage: React.FC<ResearchPageProps> = ({ onOpenDossier }) => {
  const [savedFounders, setSavedFounders] = useState<SavedFounder[]>([]);
  const [selectedFounderId, setSelectedFounderId] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [tone, setTone] = useState<string>('professional');

  const [loading, setLoading] = useState<boolean>(false);
  const [researchData, setResearchData] = useState<ResearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    api.getSavedFounders().then((saved) => {
      setSavedFounders(saved);
      if (saved.length > 0 && !selectedFounderId) {
        setSelectedFounderId(saved[0].profile_id);
      }
    }).catch(console.error);
  }, []);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFounderId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzeResearch({
        profile_id: selectedFounderId,
        custom_question: customQuestion.trim() || undefined,
        tone,
      });
      setResearchData(res);
    } catch (err: any) {
      setError(err.message || 'AI Research analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOutreach = () => {
    if (!researchData?.outreach_draft) return;
    navigator.clipboard.writeText(researchData.outreach_draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedFounder = savedFounders.find((f) => f.profile_id === selectedFounderId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Research Workspace</h1>
        <p className="text-sm text-slate-400 mt-1">
          Perform grounded deep-dive inquiries, formulate diligence questions, and synthesize career signals with Claude.
        </p>
      </div>

      {/* Query Formulation Panel */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl space-y-5">
        <form onSubmit={handleRunAnalysis} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Select Candidate
              </label>
              {savedFounders.length === 0 ? (
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400">
                  No saved founders yet. Please search and save founders in the Discover tab.
                </div>
              ) : (
                <select
                  value={selectedFounderId}
                  onChange={(e) => setSelectedFounderId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {savedFounders.map((f) => (
                    <option key={f.id} value={f.profile_id} className="bg-slate-900 text-slate-200">
                      {f.name} — {f.current_title || 'Founder'} ({f.current_company || 'Venture'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Outreach Tone & Archetype
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="professional" className="bg-slate-900">Professional (Direct & Concise)</option>
                <option value="founder" className="bg-slate-900">Founder-to-Founder (Peer Collaboration)</option>
                <option value="investor" className="bg-slate-900">Early Stage Investor / Scout</option>
                <option value="warm" className="bg-slate-900">Warm Mutual Introduction</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Specific Research Focus / Diligence Question (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Assess technical leadership at Stripe and identify key startup signals..."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-mono">
              Model: claude-sonnet-4.6 via LiteLLM
            </span>
            <button
              type="submit"
              disabled={loading || !selectedFounderId}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{loading ? 'Synthesizing...' : 'Run Research Synthesis'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          <strong>Analysis Error:</strong> {error}
        </div>
      )}

      {/* Results Workspace */}
      {researchData && (
        <div className="space-y-6 animate-fade-in">
          {/* Executive Synthesis Card */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-white">
                  Diligence Report: {selectedFounder?.name}
                </h2>
                <StatusBadge status={researchData.transition_status} size="sm" />
              </div>
              <button
                onClick={() => onOpenDossier(researchData.profile_id)}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                View full profile dossier →
              </button>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
              {researchData.research_summary}
            </p>

            {/* Evidence & Uncertainties Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Grounding Evidence</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  {researchData.supporting_evidence.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2">
                <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  <span>Identified Information Gaps</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  {researchData.uncertainties.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suggested Interview Questions */}
            {researchData.suggested_questions.length > 0 && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5 mt-2">
                <h4 className="text-xs font-semibold text-indigo-300 font-mono uppercase tracking-wider">
                  Suggested Exploratory Questions
                </h4>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {researchData.suggested_questions.map((q, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-mono">0{i + 1}.</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Outreach Draft Card */}
          {researchData.outreach_draft && (
            <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <span>Personalized Outreach Draft</span>
                  </h3>
                  <span className="text-xs text-slate-400">Tone: {tone} · Ready for review</span>
                </div>
                <button
                  onClick={handleCopyOutreach}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Draft'}</span>
                </button>
              </div>

              <textarea
                rows={6}
                value={researchData.outreach_draft}
                readOnly
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-200 focus:outline-none resize-none font-sans"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
