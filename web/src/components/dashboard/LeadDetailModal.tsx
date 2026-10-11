import { useState, type ReactNode } from 'react';
import { useToast } from '../../contexts/ToastContext.tsx';
import Icon from '../ui/Icon.tsx';
import { STATUS_META, type Lead } from '../../types.ts';
import { formatRating, initials, pareceWhatsApp } from '../../lib/format.ts';

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
}

type Aba = 'informacoes' | 'negocio' | 'localizacao' | 'anotacoes';

const STORAGE_KEY = 'dfvleads:anotacoes';

function carregarAnotacoes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Modal de detalhe do lead: dados de contacto (WhatsApp, ligar, email),
 * abas de informações, negócio, localização (mapa) e anotações locais.
 */
export default function LeadDetailModal({ lead, onClose }: LeadDetailModalProps) {
  const { toast } = useToast();
  const [aba, setAba] = useState<Aba>('informacoes');
  const [anotacoes, setAnotacoes] = useState<string>(
    () => carregarAnotacoes()[lead.id] ?? '',
  );
  const meta = STATUS_META[lead.status];

  function salvarAnotacao(valor: string) {
    setAnotacoes(valor);
    const todas = carregarAnotacoes();
    todas[lead.id] = valor;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todas));
  }

  async function copiarTelefone() {
    if (!lead.phone) return;
    try {
      await navigator.clipboard.writeText(lead.phone);
      toast('success', `Telefone copiado: ${lead.phone}`);
    } catch {
      toast('error', 'Não foi possível copiar. Copie manualmente.');
    }
  }

  const numero = (lead.phone ?? '').replace(/[^\d]/g, '');
  const mensagem = encodeURIComponent(
    `Olá! Encontrei o ${lead.name} no mapa e criei uma prévia de site profissional para você. Posso enviar para ver?`,
  );
  const whatsappUrl = numero ? `https://wa.me/${numero}?text=${mensagem}` : null;

  const abas: { id: Aba; label: string }[] = [
    { id: 'informacoes', label: 'Informações' },
    { id: 'negocio', label: 'Sobre o Negócio' },
    { id: 'localizacao', label: 'Localização' },
    { id: 'anotacoes', label: 'Anotações' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-fade-up flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-900 shadow-2xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        {/* Cabeçalho com foto/nome/status */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-extrabold text-white">
              {initials(lead.name)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white">{lead.name}</h2>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${meta.chip}`}>
                  <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${meta.cor}`} />
                  {lead.status === 'NO_SITE' ? 'Sem website' : meta.label}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {lead.address ?? 'Endereço não informado'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {/* Botões de contacto */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 px-5 py-3">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-night-950 transition hover:bg-brand-400"
            >
              <Icon name="message" className="h-4 w-4" />
              Contactar via WhatsApp
            </a>
          )}
          {lead.phone && (
            <>
              <a
                href={`tel:${numero}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                <Icon name="phone" className="h-4 w-4" />
                Ligar
              </a>
              <button
                type="button"
                onClick={() => void copiarTelefone()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                <Icon name="note" className="h-4 w-4" />
                Copiar número
              </button>
            </>
          )}
        </div>

        {/* Abas */}
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-5">
          {abas.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAba(item.id)}
              className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                aba === item.id
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5">
          {aba === 'informacoes' && (
            <dl className="space-y-3 text-sm">
              <Row label="Nome do Negócio" value={lead.name} />
              <Row label="Endereço" value={lead.address ?? '—'} />
              <Row
                label="Telefone"
                value={
                  lead.phone ? (
                    <span className="inline-flex items-center gap-2">
                      {lead.phone}
                      {pareceWhatsApp(lead.phone) && (
                        <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                          WhatsApp
                        </span>
                      )}
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
              <Row label="Website" value={lead.website ?? <span className="text-red-300">Não possui</span>} />
              <Row label="Avaliação" value={formatRating(lead.rating, lead.reviews) || '—'} />
            </dl>
          )}

          {aba === 'negocio' && (
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                Este negócio foi identificado pelo DFVLeads como{' '}
                <b className="text-white">{lead.status === 'NO_SITE' ? 'sem presença online' : meta.label.toLowerCase()}</b>.
                {lead.status === 'NO_SITE' &&
                  ' Uma landing page profissional com os dados reais (telefone, endereço, avaliações) pode ser gerada com um clique — pronta para entregar.'}
              </p>
              {lead.rating != null && (
                <p>
                  Avaliação média de <b className="text-white">{lead.rating.toFixed(1)}</b> com{' '}
                  <b className="text-white">{lead.reviews ?? 0}</b> avaliações — reputação boa para abordar com confiança.
                </p>
              )}
              <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-400">Sugestão de abordagem</p>
                <p className="mt-1.5 text-sm text-slate-300">
                  Apresente a prévia do site já pronta no WhatsApp — donos de negócio respondem melhor a algo concreto do que a uma proposta genérica.
                </p>
              </div>
            </div>
          )}

          {aba === 'localizacao' && (
            <div className="space-y-3">
              {lead.lat != null && lead.lng != null ? (
                <iframe
                  title={`Mapa de ${lead.name}`}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lead.lng - 0.01}%2C${lead.lat - 0.006}%2C${lead.lng + 0.01}%2C${lead.lat + 0.006}&layer=mapnik&marker=${lead.lat}%2C${lead.lng}`}
                  className="h-72 w-full rounded-xl border border-white/10"
                  loading="lazy"
                />
              ) : (
                <p className="rounded-xl border border-white/10 bg-night-800/60 p-4 text-sm text-slate-400">
                  Coordenadas não disponíveis para este lead.
                </p>
              )}
              <p className="text-sm text-slate-400">{lead.address ?? 'Endereço não informado'}</p>
            </div>
          )}

          {aba === 'anotacoes' && (
            <div className="space-y-2">
              <label htmlFor="anotacao" className="text-sm font-medium text-slate-300">
                As suas notas sobre este lead
              </label>
              <textarea
                id="anotacao"
                rows={6}
                value={anotacoes}
                onChange={(evento) => salvarAnotacao(evento.target.value)}
                placeholder="Ex.: ligar às terças de manhã, falar com o dono (senhor Carlos)…"
                className="input resize-y"
              />
              <p className="text-xs text-slate-500">As notas ficam guardadas neste dispositivo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-white">{value}</dd>
    </div>
  );
}
