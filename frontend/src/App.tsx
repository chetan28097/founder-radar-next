import React, { useState } from 'react';
import { NavigationTab, FounderProfile } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { OverviewPage } from './pages/OverviewPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { ProfileDetailPage } from './pages/ProfileDetailPage';
import { WatchlistsPage } from './pages/WatchlistsPage';
import { ResearchPage } from './pages/ResearchPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('landing');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<{ query?: string; employer?: string }>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleOpenDossier = (profileId: string) => {
    setSelectedProfileId(profileId);
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRunSearch = (query: string, employer?: string) => {
    setSearchParams({ query, employer });
    setCurrentTab('discover');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDraftOutreach = (profile: FounderProfile) => {
    setSelectedProfileId(profile.id);
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'landing' && (
          <LandingPage
            onEnterApp={(tab) => {
              setCurrentTab(tab || 'overview');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'overview' && (
          <OverviewPage
            onNavigate={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenDossier={handleOpenDossier}
            onRunSearch={handleRunSearch}
          />
        )}

        {currentTab === 'discover' && (
          <DiscoverPage
            initialQuery={searchParams.query}
            initialEmployer={searchParams.employer}
            onOpenDossier={handleOpenDossier}
            onDraftOutreach={handleDraftOutreach}
          />
        )}

        {currentTab === 'profile' && selectedProfileId && (
          <ProfileDetailPage
            profileId={selectedProfileId}
            onBack={() => setCurrentTab('discover')}
            onDraftOutreach={handleDraftOutreach}
          />
        )}

        {currentTab === 'watchlists' && (
          <WatchlistsPage
            onOpenDossier={handleOpenDossier}
            onNavigateToDiscover={() => setCurrentTab('discover')}
          />
        )}

        {currentTab === 'research' && (
          <ResearchPage onOpenDossier={handleOpenDossier} />
        )}

        {currentTab === 'settings' && (
          <SettingsPage />
        )}
      </main>
    </div>
  );
}

export default App;
