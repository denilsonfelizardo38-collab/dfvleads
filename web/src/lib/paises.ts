/**
 * Países atendidos com suas divisões administrativas de primeiro nível.
 * Serve de atalho no campo "Cidade / País": quem digita o país escolhe a
 * província/estado — a busca usa "Divisão, País" e o mapa resolve certinho.
 * Qualquer país FORA da lista continua funcionando: o usuário digita
 * cidade/província normalmente e o Nominatim resolve.
 */
export interface PaisComDivisoes {
  nome: string;
  rotuloDivisao: string;
  divisoes: string[];
  aliases: string[];
}

export const PAISES: PaisComDivisoes[] = [
  {
    nome: 'Brasil',
    rotuloDivisao: 'Estado',
    aliases: ['brasil', 'brazil'],
    divisoes: [
      'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
      'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
      'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
      'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
      'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins',
    ],
  },
  {
    nome: 'Angola',
    rotuloDivisao: 'Província',
    aliases: ['angola'],
    divisoes: [
      'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando', 'Cubango', 'Cuanza Norte',
      'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla', 'Icolo e Bengo', 'Luanda',
      'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico', 'Moxico Leste', 'Namibe',
      'Uíge', 'Zaire',
    ],
  },
  {
    nome: 'Moçambique',
    rotuloDivisao: 'Província',
    aliases: ['moçambique', 'mocambique', 'mozambique'],
    divisoes: [
      'Niassa', 'Cabo Delgado', 'Nampula', 'Zambézia', 'Tete', 'Manica', 'Sofala',
      'Inhambane', 'Gaza', 'Maputo Province', 'Maputo',
    ],
  },
  {
    nome: 'Portugal',
    rotuloDivisao: 'Distrito',
    aliases: ['portugal'],
    divisoes: [
      'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra', 'Évora',
      'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre', 'Porto', 'Santarém',
      'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu', 'Açores', 'Madeira',
    ],
  },
  {
    nome: 'Cabo Verde',
    rotuloDivisao: 'Ilha',
    aliases: ['cabo verde', 'cape verde'],
    divisoes: ['Santo Antão', 'São Vicente', 'São Nicolau', 'Sal', 'Boa Vista', 'Santiago', 'Fogo', 'Brava', 'Maio'],
  },
  {
    nome: 'São Tomé e Príncipe',
    rotuloDivisao: 'Distrito',
    aliases: ['são tomé', 'sao tome', 'são tomé e príncipe', 'sao tome e principe'],
    divisoes: ['Água Grande', 'Cantagalo', 'Caué', 'Lembá', 'Lobata', 'Mé-Zóchi'],
  },
  {
    nome: 'Guiné-Bissau',
    rotuloDivisao: 'Região',
    aliases: ['guiné-bissau', 'guine-bissau', 'guine bissau'],
    divisoes: ['Bafatá', 'Biombo', 'Bissau', 'Bolama', 'Cacheu', 'Gabú', 'Oio', 'Quinara', 'Tombali'],
  },
  {
    nome: 'Timor-Leste',
    rotuloDivisao: 'Município',
    aliases: ['timor-leste', 'timor leste', 'timor'],
    divisoes: ['Díli', 'Baucau', 'Bobonaro', 'Cova Lima', 'Ermera', 'Lautém', 'Liquiçá', 'Manatuto', 'Manufahi', 'Aileu', 'Ainaro', 'Atauro', 'Viqueque'],
  },
  {
    nome: 'Estados Unidos',
    rotuloDivisao: 'Estado',
    aliases: ['estados unidos', 'eua', 'usa', 'united states', 'e.u.a'],
    divisoes: [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
      'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
      'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
      'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
      'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
      'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
      'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
      'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
    ],
  },
  {
    nome: 'Reino Unido',
    rotuloDivisao: 'Nação',
    aliases: ['reino unido', 'uk', 'united kingdom'],
    divisoes: ['Inglaterra', 'Escócia', 'País de Gales', 'Irlanda do Norte'],
  },
  {
    nome: 'África do Sul',
    rotuloDivisao: 'Província',
    aliases: ['áfrica do sul', 'africa do sul', 'south africa'],
    divisoes: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'],
  },
];

function normalizar(texto: string): string {
  return texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Detecta se o texto do usuário é um país com divisões cadastradas. */
export function paisDoTexto(texto: string): PaisComDivisoes | null {
  const chave = normalizar(texto);
  if (chave.length < 3) return null;
  return PAISES.find((pais) => pais.aliases.some((alias) => chave === alias)) ?? null;
}
