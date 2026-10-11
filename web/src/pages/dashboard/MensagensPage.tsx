import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import Icon from '../../components/ui/Icon.tsx';
import Spinner from '../../components/ui/Spinner.tsx';
import { formatDate, initials, pareceWhatsApp } from '../../lib/format.ts';
import {
  listarContactos,
  marcarRespondido,
  registrarContacto,
  type Contacto,
} from '../../lib/contatos.ts';
import type { LeadLista } from '../../types.ts';

type Aba = 'todas' | 'whatsapp' | 'telefone' | 'por-contactar';

const ABAS: { id: Aba; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'telefone', label: 'Ligações' },
  { id: 'por-contactar', label: 'Não respondidas' },
];

interface LinhaContacto {
  lead: LeadLista;
  contacto?: Contacto;
}

/**
 * "Mensagens": gestor de contactos. Lista os leads com canal directo
 * (WhatsApp/telefone), regista no dispositivo quando o contato é feito e
 * permite marcar respondidos — sem depender de backend novo.
 */
export default function MensagensPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadLista[] | null>(null);
  const [contatos, setContatos] = useState<Contacto[]>(() => listarContactos());
  const [aba, setAba] = useState<Aba>('todas');

  useEffect(() => {
    let cancelled = false;
    api
      .meusLeads({ limite: 200 })
      .then((data) => {
        if (!cancelled) setLeads(data.leads);
      })
      .catch(() => {
        if (!cancelled) {
          toast('error', 'Falha ao carregar contactos.');
          setLeads([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const linhas = useMemo<LinhaContacto[]>(() => {
    const porLead = new Map(contatos.map((contato) => [contato.leadId, contato]));
    const lista = (leads ?? []).map((lead) => ({ lead, contacto: porLead.get(lead.id) }));
    // Leads contactados primeiro; depois os mais recentes.
    return lista.sort((a, b) => {
      if (a.contacto && !b.contacto) return -1;
      if (!a.contacto && b.contacto) return 1;
      return new Date(b.lead.createdAt).getTime() - new Date(a.lead.createdAt).getTime();
    });
  }, [leads, contatos]);

  const filtradas = useMemo(() => {
    switch (aba) {
      case 'whatsapp':
        return linhas.filter(
          (linha) => linha.contacto?.canal === 'whatsapp' || (!linha.contacto && pareceWhatsApp(linha.lead.phone)),
        );
      case 'telefone':
        return linhas.filter((linha) => linha.contacto?.canal === 'telefone');
      case 'por-contactar':
        return linhas.filter((linha) => !linha.contacto || !linha.contacto.respondido);
      default:
        return linhas;
    }
  }, [linhas, aba]);

  function registrarLigacao(lead: LeadLista) {
    if (!lead.phone) {
      toast('error', 'Este lead não tem telefone.');
      return;
    }
    window.location.href = `tel:${lead.phone.replace(/\D/g, '')}`;
    setContatos([registrarContacto(lead, 'telefone'), ...listarContactos().filter((c) => c.leadId !== lead.id)]);
    toast('success', `Ligação para ${lead.name} registada.`);
  }

  function alternarRespondido(leadId: string, atual: boolean) {
    marcarRespondido(leadId, !atual);
    setContatos(listarContactos());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mensagens</h1>
        <p className="mt-1 text-sm text-slate-400">Acompanhe e gere os seus contactos.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-white/10">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAba(item.id)}
            aria-pressed={aba === item.id}
            className={`shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
              aba === item.id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!leads && (
        <div className="card flex items-center gap-3 text-sm text-slate-400">
          <Spinner /> Carregando contactos…
        </div>
      )}

      {leads && filtradas.length === 0 && (
        <div className="card text-center">
          <Icon name="message" className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">
            Nada por aqui ainda.{' '}
            <Link to="/dashboard/pesquisar" className="font-semibold text-brand-400 hover:text-brand-500">
              Pesquise leads
            </Link>{' '}
            e contacte via WhatsApp para registar a conversa.
          </p>
        </div>
      )}

      {filtradas.length > 0 && (
        <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-night-900/60">
          {filtradas.map(({ lead, contacto }) => {
            const numero = (lead.phone ?? '').replace(/\D/g, '');
            const mensagem = encodeURIComponent(
              `Olá! Encontrei o ${lead.name} no mapa e criei uma prévia de site profissional para você. Posso enviar para ver?`,
            );
            const preview = contacto
              ? contacto.canal === 'whatsapp'
                ? 'Mensagem enviada pelo WhatsApp — aguardando resposta.'
                : contacto.canal === 'telefone'
                  ? 'Ligação feita para este lead.'
                  : 'Número copiado para abordagem manual.'
              : 'Ainda sem contacto registado.';

            return (
              <div key={lead.id} className="flex flex-wrap items-center gap-3 bg-night-900/40 px-4 py-3 transition hover:bg-white/[0.03]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-500/15 text-xs font-bold text-brand-400">
                  {initials(lead.name)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-white">{lead.name}</p>
                    {contacto?.respondido && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                        Respondido
                      </span>
                    )}
                    {!contacto && (
                      <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold text-slate-400 ring-1 ring-inset ring-slate-500/30">
                        Novo
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{preview}</p>
                  <p className="mt-0.5 text-[11px] text-slate-600">
                    {lead.phone ?? 'sem telefone'} ·{' '}
                    {contacto ? formatDate(contacto.em) : `Lead de ${lead.cidade || 'busca anterior'}`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {numero && (
                    <a
                      href={`https://wa.me/${numero}?text=${mensagem}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() =>
                        setContatos([
                          registrarContacto(lead, 'whatsapp'),
                          ...listarContactos().filter((c) => c.leadId !== lead.id),
                        ])
                      }
                      className="rounded-lg bg-brand-500/15 p-2 text-brand-400 transition hover:bg-brand-500/25"
                      aria-label="Abrir WhatsApp"
                    >
                      <Icon name="message" className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => registrarLigacao(lead)}
                    className="rounded-lg border border-white/15 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Ligar"
                  >
                    <Icon name="phone" className="h-4 w-4" />
                  </button>
                  {contacto && (
                    <button
                      type="button"
                      onClick={() => alternarRespondido(lead.id, Boolean(contacto.respondido))}
                      className={`rounded-lg p-2 transition ${
                        contacto.respondido
                          ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                          : 'border border-white/15 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                      aria-label={contacto.respondido ? 'Marcar como não respondido' : 'Marcar como respondido'}
                    >
                      <Icon name="check" className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
