/**
 * Gera um HTML de exemplo usando a CADEIA NOVA (Business Analyzer → Blueprint
 * → Site Builder) — para inspeção visual e validação da análise.
 * Uso: node_modules/.bin/tsx scripts/gerar-exemplo.ts [nicho] [nome] [cidade]
 */
import { writeFileSync } from 'node:fs';
import dotenv from 'dotenv';

// Igual ao servidor (npm run dev -w server roda com cwd=server).
dotenv.config({ path: 'server/.env' });

const [nichoArg, nomeArg, cidadeArg] = process.argv.slice(2);
const PRESETS: Record<string, { nome: string; cidade: string; endereco: string; telefone: string; rating?: number; reviews?: number }> = {
  barbearia: { nome: 'Barbearia Navalha de Ouro', cidade: 'Luanda', endereco: 'Rua da Missão 45, Cazenga, Luanda', telefone: '+244 923 000 111', rating: 4.8, reviews: 132 },
  pizzaria: { nome: 'Pizzaria Forno de Ouro', cidade: 'Brasília', endereco: 'Asa Norte, Brasília', telefone: '+55 61 99571-6969', rating: 4.6, reviews: 327 },
  serralheria: { nome: 'Serralheria Ferro & Arte', cidade: 'São Paulo', endereco: 'Vila Industrial, São Paulo', telefone: '+55 11 5042-4191' },
  dentista: { nome: 'Clínica Odonto Sorriso', cidade: 'Lisboa', endereco: 'Av. da Liberdade 120, Lisboa', telefone: '+351 912 345 678', rating: 4.9, reviews: 89 },
  energia: { nome: 'SolarDireta Energia Renovável', cidade: 'Maputo', endereco: 'Av. Julius Nyerere, Maputo', telefone: '+258 84 555 0000' },
  imobiliaria: { nome: 'Imobiliária Chave de Ouro', cidade: 'Maputo', endereco: 'Baixa de Maputo', telefone: '+258 82 333 4444', rating: 4.4, reviews: 51 },
};

async function main(): Promise<void> {
  const { config } = await import('../server/src/env.ts');
  const siteGen = await import('../server/src/services/siteGenerator.ts');
  const analyzer = await import('../server/src/services/businessAnalyzer.ts');

  const preset = PRESETS[nichoArg ?? 'pizzaria'] ?? PRESETS.pizzaria;
  const dados: import('../server/src/services/siteGenerator.ts').DadosEmpresa = {
    nome: nomeArg ?? preset.nome,
    nicho: nichoArg ?? 'pizzaria',
    cidade: cidadeArg ?? preset.cidade,
    telefone: preset.telefone,
    endereco: preset.endereco,
    rating: preset.rating ?? null,
    reviews: preset.reviews ?? null,
  };

  const html = await siteGen.gerarLandingPage(dados);
  writeFileSync('site-exemplo.html', html);

  // Imprime a análise (o "porquê" das decisões) no terminal.
  const blueprint = config.llmApiKey ? (await analyzer.analisarNegocio(dados)) ?? analyzer.blueprintPadrao(dados) : analyzer.blueprintPadrao(dados);
  const plano = analyzer.construirPlano(blueprint, dados);
  const resumo = analyzer.resumirAnalise(blueprint, plano, []);
  console.log('─'.repeat(60));
  console.log(`NEGÓCIO:   ${resumo.negocio} (${resumo.tipo})`);
  console.log(`MODELO:    ${resumo.modelo}`);
  console.log(`SOLUÇÃO:   ${resumo.solucao}`);
  console.log(`SEÇÕES:    ${resumo.secoes.join(' | ')}`);
  console.log(`FUNCIONAL: ${resumo.funcionalidades.join(', ')}`);
  console.log(`MOEDA:     ${resumo.moeda} · IDIOMA: ${resumo.idioma}`);
  console.log(`ARQUITETURA: ${resumo.arquitetura}`);
  console.log(`DESIGN:    ${resumo.design}`);
  console.log(`HTML:      site-exemplo.html (${(html.length / 1024).toFixed(1)} KB)`);
}

void main();
