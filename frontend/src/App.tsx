import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { OverviewPage } from './pages/OverviewPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { ProfileDetailPage } from './pages/ProfileDetailPage';
import { WatchlistsPage } from './pages/WatchlistsPage';
import { ResearchPage } from './pages/ResearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { BuiltWithPage } from './pages/BuiltWithPage';
import { EmptyState } from './components/EmptyState';
import { navigate, paths, useRoute } from './lib/router';

export function App() {
  const route = useRoute();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-ink">
      <Navbar route={route} />
      <main id="main" className="flex-1 pb-16">
        {route.name === 'landing' && <LandingPage />}
        {route.name === 'overview' && <OverviewPage />}
        {route.name === 'discover' && <DiscoverPage />}
        {route.name === 'profile' && <ProfileDetailPage key={route.id} profileId={route.id} />}
        {route.name === 'watchlists' && <WatchlistsPage />}
        {route.name === 'research' && <ResearchPage key={route.founderId || 'none'} founderId={route.founderId} />}
        {route.name === 'settings' && <SettingsPage />}
        {route.name === 'built-with' && <BuiltWithPage />}
        {route.name === 'not-found' && (
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <EmptyState
              type="error"
              title="Page not found"
              description={`There is no page at "${route.path}".`}
              actionText="Go to Discover"
              onAction={() => navigate(paths.discover())}
            />
          </div>
        )}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Founder Radar. Profile data from Crustdata; research by Claude via LiteLLM.</span>
          <a href={paths.builtWith()} className="link w-fit">
            How it was built
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
