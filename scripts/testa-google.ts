/**
 * Testa a GOOGLE_MAPS_API_KEY do server/.env com uma busca real
 * (Places API New — o mesmo endpoint usado pelo app).
 * Uso: node_modules/.bin/tsx scripts/testa-google.ts
 */
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });

async function main(): Promise<void> {
  const chave = process.env.GOOGLE_MAPS_API_KEY;
  if (!chave) {
    console.log('GOOGLE_MAPS_API_KEY vazia no server/.env — preencha e rode de novo.');
    return;
  }

  const resposta = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': chave,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,nextPageToken',
    },
    body: JSON.stringify({ textQuery: 'barbearia em Luanda', pageSize: 5 }),
  });

  if (!resposta.ok) {
    const texto = await resposta.text();
    console.log(`ERRO ${resposta.status}: ${texto.slice(0, 400)}`);
    console.log(
      resposta.status === 403
        ? 'Dica 403: ative a "Places API (New)" no Google Cloud e verifique restrições da chave.'
        : resposta.status === 400
          ? 'Dica 400: a chave é válida mas a requisição falhou — confirme a Places API (New).'
          : '',
    );
    return;
  }

  const json = (await resposta.json()) as {
    places?: { displayName?: { text?: string }; websiteUri?: string }[];
  };
  console.log(`Chave OK — ${json.places?.length ?? 0} lugares:`);
  for (const lugar of json.places ?? []) {
    const temSite = lugar.websiteUri ? 'TEM site' : 'sem site';
    console.log(`  · ${lugar.displayName?.text} — ${temSite}`);
  }

  // Amostra do que o app guarda (igual ao fluxo real da busca).
  writeFileSync(
    'google-teste-ok.txt',
    `Chave Google validada em ${new Date().toISOString()}`,
  );
  console.log('Arquivo google-teste-ok.txt criado como confirmação.');
}

void main();
