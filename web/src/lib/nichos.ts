/**
 * Catálogo completo de nichos atendidos, organizado por categoria.
 * Alimenta o datalist do formulário de busca (sugestão, não restrição:
 * nichos fora da lista continuam funcionando — a IA analisa qualquer
 * negócio e o mapa busca pelo nome quando não há filtro específico).
 */
export interface GrupoNichos {
  categoria: string;
  nichos: string[];
}

export const GRUPOS_NICHOS: GrupoNichos[] = [
  {
    categoria: 'Comida e bebida',
    nichos: [
      'Pizzaria', 'Restaurante', 'Fast food', 'Hamburgueria', 'Cafeteria',
      'Padaria', 'Pastelaria', 'Bar', 'Gelataria', 'Caminhão de comida',
      'Catering', 'Restaurante de sushi',
    ],
  },
  {
    categoria: 'Beleza e cuidados pessoais',
    nichos: [
      'Barbearia', 'Salão de beleza', 'Manicure', 'Pedicure', 'Spa',
      'Estética', 'Maquiagem', 'Massagem', 'Clínica de estética',
    ],
  },
  {
    categoria: 'Turismo e hospedagem',
    nichos: [
      'Hotel', 'Alojamento', 'Casa de hóspedes', 'Lodge', 'Resort',
      'Agência de viagens', 'Operadora turística', 'Aluguel de carro', 'Guia turística', 'Alojamento local',
    ],
  },
  {
    categoria: 'Saúde',
    nichos: [
      'Clínica', 'Clínica dentária', 'Consultório médico', 'Fisioterapia',
      'Psicologia', 'Laboratório', 'Farmácia', 'Centro de diagnóstico', 'Veterinária',
    ],
  },
  {
    categoria: 'Automóveis',
    nichos: [
      'Oficina', 'Lavagem automóvel', 'Detail automóvel', 'Stand de automóveis',
      'Aluguel de carro', 'Loja de peças', 'Pneus', 'Mecânico',
      'Eletricista automóvel', 'Funilaria',
    ],
  },
  {
    categoria: 'Casa e construção',
    nichos: [
      'Empresa de construção', 'Arquitetura', 'Engenharia', 'Design de interiores',
      'Mobiliário', 'Carpintaria', 'Canalização', 'Eletricista', 'Pintura',
      'Climatização', 'Energia solar', 'Jardinagem', 'Limpeza', 'Segurança privada',
    ],
  },
  {
    categoria: 'Empresas e serviços profissionais',
    nichos: [
      'Escritório de advocacia', 'Contabilidade', 'Consultoria', 'Agência de marketing',
      'Agência de publicidade', 'Empresa de TI', 'Desenvolvimento de software',
      'Agência imobiliária', 'Recursos humanos', 'Seguros', 'Empresa de logística',
      'Transporte', 'Importação e exportação',
    ],
  },
  {
    categoria: 'Comércio',
    nichos: [
      'Loja de roupas', 'Loja de calçados', 'Loja de eletrónicos', 'Loja de telemóveis',
      'Supermercado', 'Loja de móveis', 'Joalharia', 'Loja de cosméticos', 'Florista',
      'Loja de materiais de construção', 'Loja de artigos desportivos', 'Loja infantil', 'Pet shop',
    ],
  },
  {
    categoria: 'Educação',
    nichos: [
      'Escola', 'Colégio', 'Universidade', 'Centro de formação', 'Escola de idiomas',
      'Curso profissional', 'Explicações', 'Escola de condução', 'Academia', 'Centro de informática',
    ],
  },
  {
    categoria: 'Desporto e fitness',
    nichos: [
      'Ginásio', 'Academia de artes marciais', 'CrossFit', 'Personal trainer',
      'Yoga', 'Pilates', 'Clube desportivo', 'Campo desportivo', 'Piscina',
    ],
  },
  {
    categoria: 'Criativos e eventos',
    nichos: [
      'Fotógrafo', 'Videógrafo', 'Estúdio fotográfico', 'Organização de eventos',
      'Organizador de casamentos', 'DJ', 'Decoração de eventos', 'Salão de festas',
      'Gráfica', 'Agência de modelos',
    ],
  },
  {
    categoria: 'Agricultura e negócios locais',
    nichos: [
      'Fazenda', 'Quinta', 'Agropecuária', 'Loja agrícola',
      'Distribuidor de produtos agrícolas', 'Empresa de irrigação',
      'Empresa de equipamentos agrícolas', 'Pesca', 'Avicultura', 'Pecuária',
    ],
  },
];

/** Lista plana para o datalist do input. */
export const TODOS_NICHOS: string[] = GRUPOS_NICHOS.flatMap((grupo) => grupo.nichos);
