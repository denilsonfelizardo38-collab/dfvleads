import { type MouseEvent } from 'react';
import { useToast } from '../../contexts/ToastContext.tsx';
import Icon from '../ui/Icon.tsx';
import { STATUS_META, type Lead } from '../../types.ts';
import { formatRating, initials, pareceWhatsApp } from '../../lib/format.ts';

interface LeadCardsProps {
  leads: Lead[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onOpenDetail: (lead: Lead) => void;
  onCriarSite: (lead: Lead) => void;
}

/**
 * Resultados em cartões (layout do painel DFVLeads): foto/iniciais, nome,
 * badge de status, morada e ações — "Ver detalhes" abre o modal completo,
 * mantendo a seleção para exportação do CSV.
 */
export default function LeadCards({
  leads,
  selected,
  onToggle,
  onOpenDetail,
  onCriarSite,
}: LeadCardsProps) {
  const { toast } = useToast();

  async function copyPhone(event: MouseEvent, phone: string | null) {
    event.stopPropagation();
    if (!phone) {
      toast('error', 'Este lead não tem telefone registrado.');
      return;
    }
    try {
      await navigator.clipboard.writeText(phone);
      toast('success', `Telefone copiado: ${phone}`);
    } catch {
      toast('error', 'Não foi possível copiar. Copie manualmente.');
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {leads.map((lead) => {
        const meta = STATUS_META[lead.status];
        const marcado = selected.has(lead.id);
        return (
          <div
            key={lead.id}
            className={`card flex flex-col gap-3 transition ${
              marcado ? 'border-brand-500/50 bg-brand-500/5' : 'hover:border-white/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <label className="flex shrink-0 cursor-pointer pt-1" onClick={(evento) => evento.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => onToggle(lead.id)}
                  aria-label={`Selecionar ${lead.name}`}
                  className="h-4 w-4 accent-[#22c55e]"
                />
              </label>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-extrabold text-white">
                {initials(lead.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{lead.name}</p>
                <span
                  className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.chip}`}
                >
                  <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${meta.cor}`} />
                  {lead.status === 'NO_SITE' ? 'Sem website' : meta.label}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-500">
              <p className="flex items-center gap-1.5 truncate">
                <Icon name="pin" className="h-3.5 w-3.5 shrink-0" />
                {lead.address ?? 'Endereço não informado'}
              </p>
              <p className="flex items-center gap-1.5">
                <Icon name="phone" className="h-3.5 w-3.5 shrink-0" />
                {lead.phone ?? 'Sem telefone'}
                {pareceWhatsApp(lead.phone) && (
                  <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                    WhatsApp
                  </span>
                )}
              </p>
              <p className="flex items-center gap-1.5">
                <Icon name="star" className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                {formatRating(lead.rating, lead.reviews)}
              </p>
            </div>

            <div className="mt-auto flex items-center gap-2 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => onOpenDetail(lead)}
                className="btn-secondary flex-1 px-3! py-2! text-xs"
              >
                Ver detalhes
              </button>
              {lead.phone && (
                <button
                  type="button"
                  onClick={(evento) => void copyPhone(evento, lead.phone)}
                  className="rounded-lg border border-white/15 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Copiar telefone"
                >
                  <Icon name="phone" className="h-4 w-4" />
                </button>
              )}
              {lead.status === 'NO_SITE' && (
                <button
                  type="button"
                  onClick={() => onCriarSite(lead)}
                  className="rounded-lg bg-brand-500/15 p-2 text-brand-400 transition hover:bg-brand-500/25"
                  aria-label="Criar site"
                >
                  <Icon name="sparkles" className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
