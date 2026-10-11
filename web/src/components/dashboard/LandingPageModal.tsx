import { useState } from 'react';
import { api, API_URL } from '../../lib/api.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import Icon from '../ui/Icon.tsx';
import Spinner from '../ui/Spinner.tsx';
import type { Lead } from '../../types.ts';

interface LandingPageModalProps {
  lead: Lead;
  onClose: () => void;
}

interface AnaliseIA {
  negocio: string;
  tipo: string;
  modelo: string;
  clientes: string[];
  necessidades: string[];
  solucao: string;
  secoes: string[];
  funcionalidades: string[];
  moeda: string;
  idioma: string;
  arquitetura: string;
  design: string;
  correcoes: string[];
}

type Estado =
  | { fase: 'confirmar' }
  | { fase: 'gerando' }
  | { fase: 'pronta'; previewUrl: string; baixando: boolean; analise: AnaliseIA | null; publicado: string | null };

export default function LandingPageModal({ lead, onClose }: LandingPageModalProps) {
  const { toast } = useToast();
  const [estado, setEstado] = useState<Estado>({ fase: 'confirmar' });

  function waLink(): string {
    const numero = (lead.phone ?? '').replace(/[^\d]/g, '');
    const mensagem = encodeURIComponent(
      `Olá! Criei uma prévia de site profissional para o ${lead.name}. Posso enviar para você ver?`,
    );
    return numero ? `https://wa.me/${numero}?text=${mensagem}` : `https://wa.me/?text=${mensagem}`;
  }

  async function gerar() {
    setEstado({ fase: 'gerando' });
    try {
      const data = await api.criarLandingPage(lead.id);
      setEstado({
        fase: 'pronta',
        previewUrl: data.previewUrl,
        baixando: false,
        analise: data.analise ?? null,
        publicado: null,
      });
      toast('success', 'Site criado a partir da análise do negócio.');
    } catch (erro) {
      toast('error', erro instanceof Error ? erro.message : 'Falha ao gerar o site.');
      setEstado({ fase: 'confirmar' });
    }
  }

  async function publicar() {
    if (estado.fase !== 'pronta') return;
    const sugerido = lead.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    const escolhido = window.prompt('Endereço público do site (letras, números e hífen):', sugerido || 'meu-cliente');
    if (!escolhido) return;
    setEstado({ ...estado, baixando: true });
    try {
      const dados = await api.publicarSite(lead.id, escolhido);
      const url = `${API_URL || window.location.origin}/s/${dados.slug}`;
      setEstado({ ...estado, publicado: url, baixando: false });
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      toast('success', 'Site publicado! O link foi copiado — mande no WhatsApp do cliente.');
    } catch (erro) {
      toast('error', erro instanceof Error ? erro.message : 'Falha ao publicar.');
      setEstado({ ...estado, baixando: false });
    }
  }

  async function baixar() {
    if (estado.fase !== 'pronta') return;
    setEstado({ ...estado, baixando: true });
    try {
      const blob = await api.downloadLandingPage(lead.id);
      const url = URL.createObjectURL(blob);
      const ancora = document.createElement('a');
      ancora.href = url;
      ancora.download = `site-${lead.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.zip`;
      ancora.click();
      URL.revokeObjectURL(url);
      toast('success', 'ZIP baixado: site e mensagens prontas.');
    } catch {
      toast('error', 'Falha ao baixar o ZIP.');
    } finally {
      setEstado({ ...estado, baixando: false });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-fade-up flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 shadow-2xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 text-brand-500">
              <Icon name="sparkles" className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Criar site — {lead.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lead.address ?? 'Endereço não informado'} · {lead.phone ?? 'sem telefone'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
            aria-label="Fechar"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {estado.fase === 'confirmar' && (
          <div className="space-y-4 p-5">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              A IA vai <strong className="text-slate-900 dark:text-white">analisar este negócio</strong> (tipo, clientes,
              o que eles precisam) e <strong className="text-slate-900 dark:text-white">decidir a solução digital</strong>:
              seções, funcionalidades, formulário e mensagem de WhatsApp contextuais — nada de
              template genérico.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Cada geração (ou regeneração) consome 1 site da sua cota.
            </p>
            <ul className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
              {[
                'Usa só os dados reais: nome, telefone, endereço, avaliação do mapa — nunca inventa preços nem avaliações',
                'Moeda e idioma certos para o país do negócio',
                'Entrega do código-fonte em ZIP pronto para hospedar + mensagem de abordagem',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => void gerar()} className="btn-primary w-full">
              <Icon name="sparkles" className="h-4 w-4" />
              Analisar negócio e criar site
            </button>
          </div>
        )}

        {estado.fase === 'gerando' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-16 text-sm text-slate-500 dark:text-slate-400">
            <Spinner size="lg" />
            Analisando o negócio, planejando a solução e construindo o site… (~20–40 s)
          </div>
        )}

        {estado.fase === 'pronta' && (
          <>
            {estado.analise && (
              <div className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-5 py-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-500/15 px-2.5 py-1 font-bold text-brand-700 dark:text-brand-400">
                    {estado.analise.negocio}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{estado.analise.solucao}</span>
                </div>
                <p className="mt-1.5 text-slate-500 dark:text-slate-400">
                  Seções: {estado.analise.secoes.join(' · ')} — {estado.analise.moeda} ·{' '}
                  {estado.analise.arquitetura}
                </p>
              </div>
            )}
            <iframe
              title={`Prévia do site de ${lead.name}`}
              src={estado.previewUrl}
              className="min-h-0 w-full flex-1 bg-white"
              sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-white/10 px-5 py-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {estado.publicado ? (
                  <>
                    Publicado em{' '}
                    <a href={estado.publicado} target="_blank" rel="noreferrer" className="font-bold text-brand-700 dark:text-brand-400 hover:underline">
                      {estado.publicado}
                    </a>{' '}
                    (link copiado)
                  </>
                ) : (
                  'Prévia ao vivo do site gerado'
                )}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void publicar()}
                  className="btn-primary px-3.5! py-2! text-xs"
                >
                  <Icon name="globe" className="h-3.5 w-3.5" />
                  {estado.publicado ? 'Publicar outro endereço' : 'Publicar site'}
                </button>
                <button
                  type="button"
                  onClick={() => void gerar()}
                  className="btn-secondary px-3.5! py-2! text-xs"
                >
                  <Icon name="refresh" className="h-3.5 w-3.5" />
                  Regenerar
                </button>
                <a
                  href={waLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary px-3.5! py-2! text-xs"
                >
                  <Icon name="message" className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone.replace(/\s/g, '')}`}
                    className="btn-secondary px-3.5! py-2! text-xs"
                  >
                    <Icon name="phone" className="h-3.5 w-3.5" />
                    Ligar
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => void baixar()}
                  className="btn-primary px-3.5! py-2! text-xs"
                >
                  <Icon name="download" className="h-3.5 w-3.5" />
                  {estado.baixando ? 'Preparando…' : 'Baixar site (ZIP)'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
