import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, API_URL } from '../../lib/api.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import Icon from '../../components/ui/Icon.tsx';
import Spinner from '../../components/ui/Spinner.tsx';
import { formatDate } from '../../lib/format.ts';
import type { SiteGerado } from '../../types.ts';

/**
 * "Websites": todos os sites gerados, com prévia, publicação com link
 * próprio, download em ZIP e atalho de WhatsApp do cliente.
 */
export default function WebsitesPage() {
  const { toast } = useToast();
  const [sites, setSites] = useState<SiteGerado[] | null>(null);
  const [preview, setPreview] = useState<SiteGerado | null>(null);
  const [publicando, setPublicando] = useState<string | null>(null);

  function carregar() {
    api
      .meusSites()
      .then((data) => setSites(data.sites))
      .catch(() => {
        toast('error', 'Falha ao carregar os seus sites.');
        setSites([]);
      });
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  async function handleDownload(site: SiteGerado) {
    try {
      const blob = await api.downloadLandingPage(site.leadId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${(site.lead?.name ?? 'site').toLowerCase().replace(/\s+/g, '-')}.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast('success', 'ZIP baixado.');
    } catch {
      toast('error', 'Falha ao baixar o site.');
    }
  }

  async function handlePublicar(site: SiteGerado) {
    const slugBase = (site.lead?.name ?? 'meu-site')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    const slug = window.prompt('Escolha o endereço do site (letras, números e hífens):', slugBase);
    if (!slug) return;
    setPublicando(site.leadId);
    try {
      const data = await api.publicarSite(site.leadId, slug.trim());
      toast('success', `Site publicado em ${data.url}`);
      carregar();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Falha ao publicar.');
    } finally {
      setPublicando(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Websites</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sites gerados para os seus leads — prévia, publicação e download.
        </p>
      </div>

      {!sites && (
        <div className="card flex items-center gap-3 text-sm text-slate-400">
          <Spinner /> Carregando sites…
        </div>
      )}

      {sites && sites.length === 0 && (
        <div className="card text-center">
          <Icon name="layout" className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">
            Nenhum site gerado ainda. Encontre uma empresa sem website em{' '}
            <Link to="/dashboard/pesquisar" className="font-semibold text-brand-400 hover:text-brand-500">
              Pesquisar Leads
            </Link>{' '}
            e clique no ícone de site para criar o primeiro.
          </p>
        </div>
      )}

      {sites && sites.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => {
            const numero = (site.lead?.phone ?? '').replace(/\D/g, '');
            const mensagem = encodeURIComponent(
              `Olá! Criei um site profissional para o ${site.lead?.name ?? 'seu negócio'}.${
                site.urlPublica ? ` Veja aqui: ${API_URL}${site.urlPublica}` : ''
              }`,
            );
            return (
              <div key={site.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{site.lead?.name ?? 'Lead removido'}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Criado em {formatDate(site.criadoEm)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      site.publicado
                        ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/30'
                        : 'bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/30'
                    }`}
                  >
                    {site.publicado ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>

                {site.publicado && site.urlPublica && (
                  <a
                    href={`${API_URL}${site.urlPublica}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 truncate rounded-lg bg-night-800/70 px-3 py-2 text-xs font-medium text-brand-400 transition hover:text-brand-500"
                  >
                    <Icon name="globe" className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{API_URL}{site.urlPublica}</span>
                    <Icon name="external" className="h-3 w-3 shrink-0" />
                  </a>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => setPreview(site)}
                    className="btn-secondary flex-1 px-3! py-2! text-xs"
                  >
                    <Icon name="search" className="h-3.5 w-3.5" /> Prévia
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDownload(site)}
                    className="rounded-lg border border-white/15 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Baixar ZIP"
                  >
                    <Icon name="download" className="h-4 w-4" />
                  </button>
                  {numero && (
                    <a
                      href={`https://wa.me/${numero}?text=${mensagem}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-brand-500/15 p-2 text-brand-400 transition hover:bg-brand-500/25"
                      aria-label="Enviar por WhatsApp"
                    >
                      <Icon name="message" className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => void handlePublicar(site)}
                    disabled={publicando === site.leadId}
                    className="btn-primary px-3.5! py-2! text-xs"
                  >
                    {publicando === site.leadId ? (
                      <Spinner size="sm" />
                    ) : site.publicado ? (
                      'Republicar'
                    ) : (
                      'Publicar'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-900"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <p className="font-semibold text-white">{preview.lead?.name ?? 'Prévia'}</p>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
            <iframe
              title={`Prévia de ${preview.lead?.name ?? 'site'}`}
              src={`${API_URL}${preview.previewUrl}`}
              className="h-[70vh] w-full bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
