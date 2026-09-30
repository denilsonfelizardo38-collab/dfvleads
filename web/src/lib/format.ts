export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('pt-PT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRating(rating: number | null, reviews: number | null): string {
  if (rating == null && !reviews) return '—';
  const stars = rating != null ? rating.toFixed(1).replace('.', ',') : '—';
  return reviews ? `${stars} (${reviews})` : stars;
}

export function placeholderPhone(phone: string | null): string {
  return phone ?? 'Sem telefone';
}

/**
 * O número tem cara de WhatsApp (móvel real)? Espelha a validação do
 * servidor (openStreetMap.pareceMovel + telefoneLixo) para o painel
 * marcar os leads que provavelmente atendem no WhatsApp.
 */
export function pareceWhatsApp(phone: string | null): boolean {
  if (!phone) return false;
  const digitos = phone.replace(/\D/g, '');
  if (digitos.length < 8 || digitos.length > 15) return false;
  if (/^(0800|0300|0500|0900|4004|4002)/.test(digitos)) return false;
  if (/^(\d)\1+$/.test(digitos)) return false;
  const local = digitos.replace(/^(244|258|55|351)/, '');
  const sequencia = /^(?:01234567|12345678|123456789|23456789|98765432|987654321|87654321|76543210|1234567)$/;
  if (sequencia.test(local) || sequencia.test(digitos)) return false;
  if (/0{5,}/.test(digitos)) return false;
  if (/(\d)\1{4,}/.test(digitos)) return false;
  if (digitos.startsWith('244')) return /^2449\d{8}$/.test(digitos);
  if (digitos.startsWith('258')) return /^2588[2-7]\d{7}$/.test(digitos);
  if (digitos.startsWith('55')) return /^55\d{2}9\d{8}$/.test(digitos);
  if (digitos.startsWith('351')) return /^3519\d{8}$/.test(digitos);
  return /^[89]\d{8}$/.test(digitos);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
