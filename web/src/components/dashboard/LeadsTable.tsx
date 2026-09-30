import { useToast } from '../../contexts/ToastContext.tsx';
import Icon from '../ui/Icon.tsx';
import { STATUS_META, type Lead } from '../../types.ts';
import { formatRating, pareceWhatsApp } from '../../lib/format.ts';

interface LeadsTableProps {
  leads: Lead[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onCriarSite: (lead: Lead) => void;
}

export default function LeadsTable({ leads, selected, onToggle, onToggleAll, onCriarSite }: LeadsTableProps) {
  const { toast } = useToast();

  async function copyPhone(phone: string | null) {
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

  const allSelected = leads.length > 0 && selected.size === leads.length;

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-slate-400">
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                aria-label="Selecionar todos"
                checked={allSelected}
                onChange={onToggleAll}
                className="h-4 w-4 accent-[#22c55e]"
              />
            </th>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">Telefone</th>
            <th className="px-4 py-3 font-medium">Endereço</th>
            <th className="px-4 py-3 font-medium">Avaliações</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {leads.map((lead) => {
            const meta = STATUS_META[lead.status];
            return (
              <tr key={lead.id} className={`transition hover:bg-white/[0.04] ${meta.rowTone}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Selecionar ${lead.name}`}
                    checked={selected.has(lead.id)}
                    onChange={() => onToggle(lead.id)}
                    className="h-4 w-4 accent-[#22c55e]"
                  />
                </td>
                <td className="max-w-[220px] px-4 py-3">
                  <span className="block truncate font-medium text-white">{lead.name}</span>
                  {lead.seen && <span className="text-xs text-accent-500">vista anteriormente</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200">{lead.phone ?? '—'}</span>
                    {lead.phone && pareceWhatsApp(lead.phone) && (
                      <span
                        className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/30"
                        title="Número móvel real — provavelmente tem WhatsApp"
                      >
                        WhatsApp
                      </span>
                    )}
                    {lead.phone && (
                      <button
                        type="button"
                        onClick={() => void copyPhone(lead.phone)}
                        className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 transition hover:border-brand-500/40 hover:text-brand-500"
                        title="Copiar telefone"
                      >
                        copiar
                      </button>
                    )}
                  </div>
                </td>
                <td className="max-w-[240px] px-4 py-3">
                  <span className="block truncate text-slate-400" title={lead.address ?? ''}>
                    {lead.address ?? '—'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                  {lead.rating == null && lead.reviews == null ? (
                    <span
                      className="text-slate-600"
                      title="A fonte gratuita (OpenStreetMap) não tem avaliações — elas aparecem quando a busca usa a chave do Google Places."
                    >
                      n/d
                    </span>
                  ) : (
                    formatRating(lead.rating, lead.reviews)
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${meta.chip}`}
                  >
                    <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${meta.cor}`} />
                    {meta.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {lead.status === 'NO_SITE' && (
                      <button
                        type="button"
                        onClick={() => onCriarSite(lead)}
                        className="inline-flex items-center gap-1 rounded-md bg-brand-500/15 px-2 py-1 text-[11px] font-bold text-brand-500 transition hover:bg-brand-500/25"
                        title="Gerar landing page premium para este lead"
                      >
                        <Icon name="sparkles" className="h-3 w-3" />
                        Criar site
                      </button>
                    )}
                    {lead.website && (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent-500 hover:underline"
                      >
                        link
                      </a>
                    )}
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone.replace(/\s/g, '')}`}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        ligar
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
