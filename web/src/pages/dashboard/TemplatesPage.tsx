import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon.tsx';

/**
 * "Templates": galeria de estilos por tipo de negócio. Os sites são gerados
 * pela IA com os dados reais de cada lead — o template escolhido aqui serve
 * de inspiração e leva o usuário direto à busca do nicho.
 */
interface Template {
  nome: string;
  categoria: string;
  nicho: string;
  descricao: string;
  gradiente: string;
}

const TEMPLATES: Template[] = [
  {
    nome: 'Sabor da Ilha',
    categoria: 'Restaurante',
    nicho: 'Restaurante',
    descricao: 'Hero com pratos em destaque, menu com preços e galeria.',
    gradiente: 'from-orange-500/80 to-red-600/80',
  },
  {
    nome: 'Navalha Premium',
    categoria: 'Barbearia',
    nicho: 'Barbearia',
    descricao: 'Tema escuro, galeria de cortes e agendamento por WhatsApp.',
    gradiente: 'from-slate-500/80 to-slate-800/80',
  },
  {
    nome: 'Vitrine Urbana',
    categoria: 'Loja',
    nicho: 'Loja',
    descricao: 'Vitrine de produtos, destaques e contactos rápidos.',
    gradiente: 'from-violet-500/80 to-fuchsia-600/80',
  },
  {
    nome: 'Clínica Care',
    categoria: 'Serviços',
    nicho: 'Clínica',
    descricao: 'Cores calmas, serviços, equipa e marcação de consulta.',
    gradiente: 'from-teal-500/80 to-emerald-600/80',
  },
  {
    nome: 'Stay Comfort',
    categoria: 'Turismo',
    nicho: 'Hotel',
    descricao: 'Acomodações, tarifas, mapa e reserva direta.',
    gradiente: 'from-cyan-500/80 to-teal-600/80',
  },
  {
    nome: 'Studio Snap',
    categoria: 'Outros',
    nicho: 'Fotografia',
    descricao: 'Portfólio em grade com lightbox e pedido de orçamento.',
    gradiente: 'from-pink-500/80 to-rose-600/80',
  },
];

const CATEGORIAS = ['Todos', 'Restaurante', 'Barbearia', 'Loja', 'Serviços', 'Turismo', 'Outros'];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState('Todos');

  const filtrados = useMemo(
    () =>
      categoria === 'Todos'
        ? TEMPLATES
        : TEMPLATES.filter((template) => template.categoria === categoria),
    [categoria],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Templates</h1>
        <p className="mt-1 text-sm text-slate-400">
          Estilos prontos por tipo de negócio — a IA adapta o template aos dados reais de cada lead.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategoria(item)}
            aria-pressed={categoria === item}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              categoria === item
                ? 'bg-brand-500 text-night-950'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtrados.map((template) => (
          <div key={template.nome} className="card flex flex-col gap-3 overflow-hidden p-0">
            {/* Prévia estilizada do template */}
            <div className={`relative h-36 bg-gradient-to-br ${template.gradiente} p-4`}>
              <div className="rounded-lg bg-night-950/80 p-2.5 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="h-2.5 w-2/3 rounded bg-white/50" />
                  <div className="h-2 w-1/2 rounded bg-white/30" />
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div className="h-6 rounded bg-white/20" />
                    <div className="h-6 rounded bg-white/20" />
                    <div className="h-6 rounded bg-white/20" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4 pt-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">{template.nome}</h3>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                  {template.categoria}
                </span>
              </div>
              <p className="text-xs text-slate-500">{template.descricao}</p>
              <button
                type="button"
                onClick={() => navigate('/dashboard/pesquisar')}
                className="btn-secondary mt-auto w-full py-2! text-xs"
              >
                <Icon name="search" className="h-3.5 w-3.5" />
                Pesquisar “{template.nicho}” e gerar site
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4 text-sm text-slate-300">
        <p className="flex items-start gap-2">
          <Icon name="sparkles" className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
          <span>
            Não precisa escolher template manualmente: ao gerar o site de um lead, a IA analisa o
            negócio e aplica automaticamente o layout mais indicado para o nicho.
          </span>
        </p>
      </div>
    </div>
  );
}
