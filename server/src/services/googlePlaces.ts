import { config } from '../env.ts';
import type { PlaceCandidate } from '../types.ts';

/**
 * Cliente do Google Places API (New).
 * Endpoint: POST https://places.googleapis.com/v1/places:searchText
 * Paginação via nextPageToken (até ~60 resultados = 3 páginas de 20).
 */

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.location',
  'nextPageToken',
].join(',');

interface GPlace {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude: number; longitude: number };
}

interface SearchTextResponse {
  places?: GPlace[];
  nextPageToken?: string;
}

export async function placesSearchText(
  query: string,
  opts: { maxResults?: number } = {},
): Promise<{ places: PlaceCandidate[]; partial: boolean }> {
  if (!config.googleMapsApiKey) {
    throw Object.assign(
      new Error('GOOGLE_MAPS_API_KEY não configurada no backend (server/.env).'),
      { status: 503 },
    );
  }

  const max = opts.maxResults ?? 60; // 3 páginas × 20
  const collected: PlaceCandidate[] = [];
  let pageToken: string | undefined;
  let page = 0;

  do {
    const body: Record<string, unknown> = { textQuery: query, pageSize: 20 };
    if (pageToken) body.pageToken = pageToken;

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': config.googleMapsApiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      let message = `Places API ${response.status}`;
      try {
        message = JSON.parse(text)?.error?.message ?? message;
      } catch {
        /* mantém mensagem padrão */
      }
      throw Object.assign(new Error(message), { status: 502 });
    }

    const data = (await response.json()) as SearchTextResponse;
    for (const place of data.places ?? []) {
      collected.push({
        placeId: place.id,
        name: place.displayName?.text ?? '(sem nome)',
        phone: place.internationalPhoneNumber ?? null,
        address: place.formattedAddress ?? null,
        website: place.websiteUri ?? null,
        rating: typeof place.rating === 'number' ? place.rating : null,
        reviews: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
        lat: place.location?.latitude ?? null,
        lng: place.location?.longitude ?? null,
      });
    }

    pageToken = data.nextPageToken;
    page += 1;
  } while (pageToken && collected.length < max && page < 3);

  return { places: collected.slice(0, max), partial: Boolean(pageToken) };
}
