/**
 * Valida a busca OpenStreetMap de ponta a ponta — o cenário que travava
 * (nicho fora do dicionário + país inteiro) e um caso normal de cidade.
 * Uso: node_modules/.bin/tsx scripts/testa-busca.ts
 */
import { buscarLugaresOsm } from '../server/src/services/openStreetMap.ts';

const casos: { nicho: string; cidade: string }[] = [
  { nicho: 'serralheria', cidade: 'Brasil' },
  { nicho: 'barbearia', cidade: 'São Paulo' },
];

async function main(): Promise<void> {
  for (const caso of casos) {
    const inicio = Date.now();
    try {
      const { places, aviso } = await buscarLugaresOsm(caso.nicho, caso.cidade);
      const tempo = ((Date.now() - inicio) / 1000).toFixed(1);
      console.log(`\n${caso.nicho} em ${caso.cidade}: ${places.length} lugares em ${tempo}s`);
      if (aviso) console.log('aviso:', aviso);
      console.log('exemplos:', places.slice(0, 5).map((p) => p.name).join(' | '));
      console.log(`sem site aparente: ${places.filter((p) => !p.website).length}/${places.length}`);
    } catch (erro) {
      console.error(`\n${caso.nicho} em ${caso.cidade} — ERRO:`, (erro as Error).message);
      process.exitCode = 1;
    }
  }
}

void main();
