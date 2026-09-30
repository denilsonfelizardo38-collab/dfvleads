/**
 * Mede o custo real da sonda de sites escondidos sobre leads reais.
 * Uso: node_modules/.bin/tsx scripts/testa-sonda.ts
 */
import { buscarLugaresOsm } from '../server/src/services/openStreetMap.ts';
import { sondarLote } from '../server/src/services/siteProbe.ts';

async function main(): Promise<void> {
  const { places } = await buscarLugaresOsm('serralheria', 'São Paulo');
  const amostra = places.slice(0, 15);
  console.log(`sondando ${amostra.length} leads reais de serralheria em São Paulo…`);

  const inicio = Date.now();
  const sites = await sondarLote(amostra);
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);

  console.log(`sonda concluída em ${segundos}s — ${sites.size} site(s) escondido(s) descoberto(s)`);
  for (const [placeId, site] of sites) {
    const nome = amostra.find((p) => p.placeId === placeId)?.name ?? placeId;
    console.log(`  - ${nome}: ${site}`);
  }
}

void main();
