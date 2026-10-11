import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import { useProfile } from '../../hooks/useProfile.ts';
import Icon from '../../components/ui/Icon.tsx';
import Spinner from '../../components/ui/Spinner.tsx';
import type { PagamentoPedido, PlanoCatalogo } from '../../types.ts';

type Etapa = { fase: 'catalogo' } | { fase: 'pagamento'; plano: PlanoCatalogo };

const BANCOS = [
  { metodo: 'binance', nome: 'Binance (USDT)', nota: 'Pay ID ou hash da transferência' },
  { metodo: 'paypal', nome: 'PayPal', nota: 'ID da transação do PayPal' },
];



export default function PlanosPage() {
  const { toast } = useToast();
  const { profile, refresh } = useProfile();
  const [planos, setPlanos] = useState<PlanoCatalogo[]>([]);
  const [whatsappAdmin, setWhatsappAdmin] = useState('258879101185');
  const [metodos, setMetodos] = useState<{ paypal: boolean; binance: boolean }>({ paypal: false, binance: false });
  const [etapa, setEtapa] = useState<Etapa>({ fase: 'catalogo' });
  const [metodo, setMetodo] = useState('binance');
  const [referencia, setReferencia] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [historico, setHistorico] = useState<PagamentoPedido[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [catalogo, pagamentos, listaMetodos] = await Promise.all([api.planos(), api.meusPagamentos(), api.metodosPagamento()]);
        setPlanos(catalogo.planos);
        setWhatsappAdmin(catalogo.whatsappAdmin);
        setMetodos(listaMetodos);
        setHistorico(pagamentos.pagamentos);
      } catch {
        toast('error', 'Falha ao carregar os planos.');
      } finally {
        setCarregando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Volta do PayPal/redirect: ?pagamento=sucesso|cancelado
  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    if (parametros.get('pagamento') === 'sucesso') {
      toast('success', 'Pagamento aprovado! Seu plano já está ativo.');
      void refresh();
      window.history.replaceState({}, '', '/dashboard/planos');
    } else if (parametros.get('pagamento') === 'cancelado') {
      toast('info', 'Pagamento cancelado — nenhum valor foi cobrado.');
      window.history.replaceState({}, '', '/dashboard/planos');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pagarAutomatico(plano: PlanoCatalogo, provedor: 'paypal' | 'binance') {
    setEnviando(true);
    try {
      if (provedor === 'paypal') {
        const dados = await api.checkoutPaypal(plano.key);
        window.location.href = dados.aprovacaoUrl; // vai ao PayPal e volta
      } else {
        const dados = await api.checkoutBinance(plano.key);
        window.open(dados.pagamentoUrl, '_blank');
        toast('info', 'Conclua o pagamento na janela do Binance. O plano ativa automaticamente em segundos.');
        setTimeout(async () => {
          const pagamentos = await api.meusPagamentos();
          setHistorico(pagamentos.pagamentos);
          void refresh();
        }, 15_000);
      }
    } catch (erro) {
      toast('error', erro instanceof Error ? erro.message : 'Falha ao iniciar o pagamento.');
    } finally {
      setEnviando(false);
    }
  }

  async function submeter() {
    if (etapa.fase !== 'pagamento') return;
    if (referencia.trim().length < 4) {
      toast('error', 'Cole o ID/hash da transferência para o admin conferir.');
      return;
    }
    setEnviando(true);
    try {
      const pedido = await api.submeterPagamento({ planKey: etapa.plano.key, metodo, referencia: referencia.trim() });
      // Abre o WhatsApp com a mensagem pronta — o usuário só aperta enviar.
      window.open(pedido.whatsappUrl, '_blank');
      toast('success', 'Pedido registrado! Confirme o envio da mensagem no WhatsApp.');
      setEtapa({ fase: 'catalogo' });
      setReferencia('');
      const pagamentos = await api.meusPagamentos();
      setHistorico(pagamentos.pagamentos);
    } catch (erro) {
      toast('error', erro instanceof ApiError || erro instanceof Error ? erro.message : 'Falha ao registrar o pagamento.');
    } finally {
      setEnviando(false);
    }
  }

  const pendentes = historico.filter((p) => p.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Planos</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Assine por Binance (USDT) ou PayPal. Após pagar, clique em confirmar — abre o WhatsApp com o
          comprovante pronto para o administrador ativar seu plano.
        </p>
      </div>

      {profile && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
            <span className="text-slate-500 dark:text-slate-400">
              Plano atual: <b className="text-slate-900 dark:text-white">{profile.planoInfo ? profile.planoInfo.nome : 'Grátis'}</b>
            </span>
            {profile.planoAtivo && profile.planExpires && (
              <span className="text-slate-500 dark:text-slate-400">
                Válido até <b className="text-slate-900 dark:text-white">{new Date(profile.planExpires).toLocaleDateString('pt-BR')}</b>
              </span>
            )}
            <span className="text-slate-500 dark:text-slate-400">
              Buscas: <b className="text-slate-900 dark:text-white">{profile.searchesUsed ?? 0}{profile.planoInfo ? `/${profile.planoInfo.pesquisas}` : ''}</b>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Sites: <b className="text-slate-900 dark:text-white">{profile.sitesUsed ?? 0}{profile.planoInfo ? `/${profile.planoInfo.sites}` : ''}</b>
            </span>
          </div>
        </div>
      )}

      {etapa.fase === 'pagamento' ? (
        <div className="max-w-xl space-y-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">
              Pagar {etapa.plano.nome} — {etapa.plano.precoUsd} USD
            </h2>
            <button type="button" onClick={() => setEtapa({ fase: 'catalogo' })} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              cancelar
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {BANCOS.map((banco) => (
              <button
                key={banco.metodo}
                type="button"
                onClick={() => setMetodo(banco.metodo)}
                className={`rounded-xl border p-3 text-left transition ${
                  metodo === banco.metodo
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/15'
                }`}
              >
                <span className="block text-sm font-bold text-slate-900 dark:text-white">{banco.nome}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{banco.nota}</span>
              </button>
            ))}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {metodo === 'binance' ? 'ID / Pay ID / Hash Binance' : 'ID da transação PayPal'}
            </span>
            <textarea
              value={referencia}
              onChange={(evento) => setReferencia(evento.target.value)}
              rows={2}
              placeholder="Cole aqui o comprovante/ID da transferência"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-brand-500"
            />
          </label>

          <ol className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <li>1. Faça a transferência de {etapa.plano.precoUsd} USD via {metodo === 'binance' ? 'Binance' : 'PayPal'}.</li>
            <li>2. Cole o ID/hash acima e clique em confirmar.</li>
            <li>3. Vai abrir o WhatsApp do administrador ({whatsappAdmin}) com tudo preenchido — envie.</li>
            <li>4. O admin confirma no painel e seu plano ativa na hora.</li>
          </ol>

          <button type="button" onClick={() => void submeter()} disabled={enviando} className="btn-primary w-full">
            {enviando ? <Spinner size="sm" /> : <Icon name="message" className="h-4 w-4" />}
            {enviando ? 'Registrando…' : 'Confirmar pagamento e abrir WhatsApp'}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {carregando
            ? [...Array(3)].map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900" />
              ))
            : planos.map((plano) => (
                <div
                  key={plano.key}
                  className={`relative flex flex-col rounded-2xl border bg-white dark:bg-night-900 p-5 ${
                    plano.destaque ? 'border-brand-500/60 ring-1 ring-brand-500/30' : 'border-slate-200 dark:border-white/10'
                  }`}
                >
                  {plano.destaque && (
                    <span className="absolute -top-2.5 left-4 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      mais vendido
                    </span>
                  )}
                  <h3 className="font-bold text-slate-900 dark:text-white">{plano.nome}</h3>
                  <p className="mt-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{plano.precoUsd}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400"> USD/mês</span>
                  </p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <Icon name="check" className="h-3.5 w-3.5 text-brand-500" />
                      {plano.pesquisas} pesquisas de empresas
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon name="check" className="h-3.5 w-3.5 text-brand-500" />
                      {plano.sites} sites gerados com IA
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon name="check" className="h-3.5 w-3.5 text-brand-500" />
                      Publicação de sites com link próprio
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon name="check" className="h-3.5 w-3.5 text-brand-500" />
                      Exportação CSV e contato por WhatsApp
                    </li>
                  </ul>
                  <div className="mt-5 space-y-2">
                    {metodos.paypal && (
                      <button
                        type="button"
                        onClick={() => void pagarAutomatico(plano, 'paypal')}
                        disabled={enviando}
                        className={`w-full ${plano.destaque ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {enviando ? 'Abrindo…' : 'Pagar com PayPal (automático)'}
                      </button>
                    )}
                    {metodos.binance && (
                      <button
                        type="button"
                        onClick={() => void pagarAutomatico(plano, 'binance')}
                        disabled={enviando}
                        className="btn-secondary w-full"
                      >
                        Pagar com Binance (USDT, automático)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEtapa({ fase: 'pagamento', plano })}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 transition hover:border-slate-300 dark:hover:border-white/15 hover:text-slate-900 dark:hover:text-white"
                    >
                      Ou pagar por WhatsApp (manual)
                    </button>
                  </div>
                </div>
              ))}
        </div>
      )}

      {pendentes.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-200">
          Você tem {pendentes.length} pagamento(s) aguardando confirmação do administrador. Assim que
          confirmar no WhatsApp, a ativação é rápida.
        </div>
      )}

      {historico.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.03] text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5">Plano</th>
                <th className="px-4 py-2.5">Valor</th>
                <th className="px-4 py-2.5">Método</th>
                <th className="px-4 py-2.5">Data</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {historico.map((pedido) => (
                <tr key={pedido.id} className="text-slate-600 dark:text-slate-300">
                  <td className="px-4 py-2.5">{pedido.plan_key}</td>
                  <td className="px-4 py-2.5">{pedido.amount_usd} USD</td>
                  <td className="px-4 py-2.5 capitalize">{pedido.metodo}</td>
                  <td className="px-4 py-2.5">{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        pedido.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : pedido.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : 'bg-red-500/15 text-red-600 dark:text-red-300'
                      }`}
                    >
                      {pedido.status === 'approved' ? 'aprovado' : pedido.status === 'pending' ? 'pendente' : 'rejeitado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
