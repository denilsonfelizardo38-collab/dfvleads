import type { LeadStatus } from '../types.ts';

/**
 * Regras de detecção:
 *  - sem campo website      => NO_SITE  (marcador vermelho)
 *  - website de rede social => SOCIAL_ONLY (marcador âmbar)
 *  - site próprio           => HAS_SITE (descartável — renderizar em cinza)
 */
export function classifyLead(website: string | null | undefined): LeadStatus {
  if (!website || !website.trim()) return 'NO_SITE';

  const url = website.toLowerCase();
  const socialHosts = [
    'facebook.com',
    'fb.com',
    'instagram.com',
    'linktr.ee',
    'linktree.com',
    'wa.me',
    'api.whatsapp.com',
    'web.whatsapp.com',
    'tiktok.com',
    'twitter.com',
    'x.com',
    'linkedin.com',
    'youtube.com',
    'business.site', // "sites" grátis do Google, na prática não são site próprio
    'godaddysites.com',
    'wixsite.com',
  ];

  if (socialHosts.some((host) => url.includes(host))) return 'SOCIAL_ONLY';
  return 'HAS_SITE';
}
