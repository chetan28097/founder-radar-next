import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, MapPin, Building2, Calendar, Bookmark, BookmarkCheck,
  Sparkles, ShieldCheck, HelpCircle, Mail, Copy, Check, Save,
  AlertTriangle, ExternalLink, Loader2, RefreshCw, CheckCircle2
} from 'lucide-react';
import { ProfileDossier, FounderProfile } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { SaveModal } from '../components/SaveModal';

interface ProfileDetailPageProps {
  profileId: string;
  onBack: () => void;
  onDraftOutreach?: (profile: FounderProfile) => void;
}

export const ProfileDetailPage: React.FC<ProfileDetailPageProps> = ({
  profileId,
  onBack,
  onDraftOutreach,
}) => {
  const [dossier, setDossier] = useState<ProfileDossier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Editable notes state
  const [notes, setNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState<boolean>(false);

  // Outreach generation state
  const [outreachTone, setOutreachTone] = useState<string>('professional');
  const [outreachSubject, setOutreachSubject] = useState<string>('');
  const [outreachBody, setOutreachBody] = useState<string>('');
  const [generatingOutreach, setGeneratingOutreach] = useState<boolean>(false);
  const [copiedOutreach, setCopiedOutreach] = useState<boolean>(false);

  // Save Modal
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getProfileDossier(profileId)
      .then((data) => {
        setDossier(data);
        setNotes(data.notes || '');
        setOutreachBody(data.outreach_draft || '');
        setOutreachSubject(
          `Connecting with ${data.profile.current_company || 'your venture'} / ex-${data.profile.past_jobs[0]?.company || 'industry'}`
        );
      })
      .catch((err) => {
        setError(err.message || 'Failed to retrieve profile dossier');
      })
      .finally(() => setLoading(false));

    api.getSavedFounders().then((saved) => {
      setIsSaved(saved.some((s) => s.profile_id === profileId));
    }).catch(console.error);
  }, [profileId]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      // First ensure founder is saved if not already
      if (!isSaved && dossier) {
        await api.saveFounder({
          profile_id: dossier.profile.id,
          name: dossier.profile.name,
          headline: dossier.profile.headline,
          current_company: dossier.profile.current_company,
          current_title: dossier.profile.current_title,
          location: dossier.profile.location,
          notes: notes,
          tags: dossier.profile.tags,
        });
        setIsSaved(true);
      } else {
        await api.updateNotes(profileId, notes);
      }
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleRegenerateOutreach = async () => {
    if (!dossier) return;
    setGeneratingOutreach(true);
    try {
      const res = await api.generateOutreach({
        profile_id: profileId,
        tone: outreachTone,
      });
      setOutreachSubject(res.subject);
      setOutreachBody(res.body);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingOutreach(false);
    }
  };

  const handleCopyOutreach = () => {
    const fullText = `Subject: ${outreachSubject}\n\n${outreachBody}`;
    navigator.clipboard.writeText(fullText);
    setCopiedOutreach(true);
    setTimeout(() => setCopiedOutreach(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Assembling founder intelligence dossier from Crustdata & Claude...</p>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm">
          {error || 'Profile could not be loaded.'}
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200"
        >
          ← Return to Search
        </button>
      </div>
    );
  }

  const { profile } = dossier;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discover</span>
        </button>

        <button
          onClick={() => setIsSaveModalOpen(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
            isSaved
              ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
              : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.08]'
          }`}
        >
          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-indigo-400" /> : <Bookmark className="w-3.5 h-3.5" />}
          <span>{isSaved ? 'Saved in Watchlist' : 'Save to Watchlist'}</span>
        </button>
      </div>

      {/* Profile Header Dossier Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-20 h-20 rounded-2xl object-cover border border-white/10 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xl font-bold text-indigo-300 shrink-0">
                {profile.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">{profile.name}</h1>
                <StatusBadge status={profile.transition_status} />
              </div>
              <p className="text-sm font-medium text-indigo-300">
                {profile.current_title || 'Founder'}
                {profile.current_company && ` at ${profile.current_company}`}
              </p>
              {profile.headline && (
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">{profile.headline}</p>
              )}
              <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 font-mono">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{profile.location}</span>
                  </span>
                )}
                <span>·</span>
                <span>Crustdata ID: {profile.crustdata_id || profile.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transition Summary Alert */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block">
            Transition Signal Evaluation
          </span>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {profile.transition_summary}
          </p>
        </div>
      </div>

      {/* Main Dossier Content (2 Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Career Timeline (1 Col) */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Career Trajectory</span>
          </h2>

          <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-6">
            {dossier.career_timeline.map((pos, idx) => (
              <div key={idx} className="relative pl-6 pb-2 last:pb-0 border-l border-white/10 last:border-0">
                <div
                  className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${
                    pos.is_current ? 'bg-emerald-400 ring-4 ring-emerald-500/20' : 'bg-slate-600'
                  }`}
                />
                <div>
                  <h4 className="text-xs font-semibold text-white">{pos.title}</h4>
                  <div className="text-xs font-medium text-indigo-300 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span>{pos.company}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    {pos.start_date ? pos.start_date.slice(0, 7) : 'Date Unknown'} –{' '}
                    {pos.is_current ? 'Present' : (pos.end_date ? pos.end_date.slice(0, 7) : 'Unknown')}
                  </div>
                  {pos.description && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {pos.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Diligence & Verification Steps */}
          <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5 uppercase tracking-wider font-mono text-slate-400">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Recommended Verification</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {dossier.recommended_verification.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400 font-mono">0{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: AI Research Dossier & Outreach Generator (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Grounded Synthesis */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI Research Synthesis</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-500">Claude Sonnet 4.6 Grounded</span>
            </div>

            <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed space-y-3">
              <p>{dossier.ai_research_summary}</p>
            </div>

            {/* Factual Evidence vs Uncertainties Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Factual Grounds</span>
                </span>
                <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                  {dossier.transition_evidence.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2">
                <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Identified Information Gaps</span>
                </span>
                <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                  {dossier.information_gaps.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Editable Research Notes */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Private Research Notes</h3>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-white/10 border border-white/10 text-slate-200 transition-colors flex items-center gap-1.5"
              >
                {savingNotes ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : notesSavedSuccess ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                <span>{notesSavedSuccess ? 'Saved' : 'Save Notes'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="Record diligence impressions, interview notes, or co-founder references..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white/[0.03] border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Interactive Outreach Draft Generator */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span>Personalized Outreach Draft</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Draft grounded communication for human review. Never auto-sent.
                </p>
              </div>

              {/* Tone Selector */}
              <div className="flex items-center gap-1.5 text-xs">
                {['professional', 'casual', 'investor'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setOutreachTone(t);
                    }}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      outreachTone === t
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-white/[0.03] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
                <button
                  onClick={handleRegenerateOutreach}
                  disabled={generatingOutreach}
                  className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 transition-colors ml-1"
                  title="Regenerate with selected tone"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generatingOutreach ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={outreachSubject}
                  onChange={(e) => setOutreachSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white/[0.03] border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Message Body</label>
                <textarea
                  rows={6}
                  value={outreachBody}
                  onChange={(e) => setOutreachBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white/[0.03] border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Note: Review and send manually from your preferred email client.
              </span>
              <button
                onClick={handleCopyOutreach}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                {copiedOutreach ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedOutreach ? 'Copied to Clipboard' : 'Copy Message'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      <SaveModal
        profile={profile}
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSuccess={() => setIsSaved(true)}
      />
    </div>
  );
};
