import { Suspense, lazy, useMemo, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar.tsx';
import Header from '../components/dashboard/Header.tsx';
import Spinner from '../components/ui/Spinner.tsx';
import { useProfile } from '../hooks/useProfile.ts';
import type { SearchRecord } from '../types.ts';

// Code-splitting: cada página do painel vira um chunk separado — o bundle
// inicial carrega só o essencial, e o resto vem sob demanda por rota.
const DashboardHome = lazy(() => import('./dashboard/DashboardHome.tsx'));
const SearchPage = lazy(() => import('./dashboard/SearchPage.tsx'));
const MeusLeadsPage = lazy(() => import('./dashboard/MeusLeadsPage.tsx'));
const WebsitesPage = lazy(() => import('./dashboard/WebsitesPage.tsx'));
const TemplatesPage = lazy(() => import('./dashboard/TemplatesPage.tsx'));
const MensagensPage = lazy(() => import('./dashboard/MensagensPage.tsx'));
const PerfilPage = lazy(() => import('./dashboard/PerfilPage.tsx'));
const HistoryPage = lazy(() => import('./dashboard/HistoryPage.tsx'));
const CreditsPage = lazy(() => import('./dashboard/CreditsPage.tsx'));
const SettingsPage = lazy(() => import('./dashboard/SettingsPage.tsx'));
const PlanosPage = lazy(() => import('./dashboard/PlanosPage.tsx'));
const AdminPage = lazy(() => import('./dashboard/AdminPage.tsx'));

function Fallback() {
  return (
    <div className="flex items-center gap-2 py-16 text-sm text-slate-500 dark:text-slate-400">
      <Spinner /> Carregando…
    </div>
  );
}

export default function Dashboard() {
  const { profile, setProfile, refresh } = useProfile();
  const navigate = useNavigate();
  const [preloadedSearch, setPreloadedSearch] = useState<SearchRecord | null>(null);

  const openFromHistory = useMemo(
    () => (search: SearchRecord) => {
      setPreloadedSearch(search);
      // O SearchPage vive em /dashboard/pesquisar desde o novo layout.
      navigate('/dashboard/pesquisar', { replace: true });
    },
    [navigate],
  );
  const consumePreload = useMemo(() => () => setPreloadedSearch(null), []);

  function handleCreditsChange(credits: number) {
    setProfile((current) => (current ? { ...current, credits } : current));
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f4] dark:bg-night-950 md:flex-row">
      <Sidebar isAdmin={profile?.isAdmin ?? false} profile={profile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header profile={profile} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <Suspense fallback={<Fallback />}>
            <Routes>
              <Route index element={<DashboardHome profile={profile} />} />
              <Route
                path="pesquisar"
                element={
                  <SearchPage
                    profile={profile}
                    onCreditsChange={handleCreditsChange}
                    preloadedSearch={preloadedSearch}
                    onPreloadConsumed={consumePreload}
                  />
                }
              />
              <Route path="leads" element={<MeusLeadsPage />} />
              <Route path="websites" element={<WebsitesPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="mensagens" element={<MensagensPage />} />
              <Route path="perfil" element={<PerfilPage profile={profile} onSaved={() => void refresh()} />} />
              <Route path="historico" element={<HistoryPage onOpen={openFromHistory} />} />
              <Route path="creditos" element={<CreditsPage profile={profile} />} />
              <Route path="planos" element={<PlanosPage />} />
              <Route path="configuracoes" element={<SettingsPage profile={profile} />} />
              {profile?.isAdmin && <Route path="admin" element={<AdminPage />} />}
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
