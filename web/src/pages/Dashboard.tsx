import { useMemo, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar.tsx';
import Header from '../components/dashboard/Header.tsx';
import SearchPage from './dashboard/SearchPage.tsx';
import HistoryPage from './dashboard/HistoryPage.tsx';
import CreditsPage from './dashboard/CreditsPage.tsx';
import SettingsPage from './dashboard/SettingsPage.tsx';
import PlanosPage from './dashboard/PlanosPage.tsx';
import AdminPage from './dashboard/AdminPage.tsx';
import { useProfile } from '../hooks/useProfile.ts';
import type { SearchRecord } from '../types.ts';

export default function Dashboard() {
  const { profile, setProfile } = useProfile();
  const navigate = useNavigate();
  const [preloadedSearch, setPreloadedSearch] = useState<SearchRecord | null>(null);

  const openFromHistory = useMemo(
    () => (search: SearchRecord) => {
      setPreloadedSearch(search);
      navigate('/dashboard', { replace: true });
    },
    [navigate],
  );
  const consumePreload = useMemo(() => () => setPreloadedSearch(null), []);

  function handleCreditsChange(credits: number) {
    setProfile((current) => (current ? { ...current, credits } : current));
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar isAdmin={profile?.isAdmin ?? false} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header profile={profile} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
          <Routes>
            <Route
              index
              element={
                <SearchPage
                  profile={profile}
                  onCreditsChange={handleCreditsChange}
                  preloadedSearch={preloadedSearch}
                  onPreloadConsumed={consumePreload}
                />
              }
            />
            <Route path="historico" element={<HistoryPage onOpen={openFromHistory} />} />
            <Route path="creditos" element={<CreditsPage profile={profile} />} />
            <Route path="planos" element={<PlanosPage />} />
            <Route path="configuracoes" element={<SettingsPage profile={profile} />} />
            {profile?.isAdmin && <Route path="admin" element={<AdminPage />} />}
          </Routes>
        </main>
      </div>
    </div>
  );
}
