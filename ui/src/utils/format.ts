// Formatting & JID utilities extracted from App.tsx (refactor stage 1)

import type { Contact, Group } from '../types';

export function parsePhoneFromJid(jid: string): string | null {
  if (!jid) return null;
  const [local, domain] = jid.split('@');
  if (domain && !domain.startsWith('c.us') && domain !== 's.whatsapp.net') return null;
  const user = local.split(':')[0];
  if (!/^\d+$/.test(user)) return null;
  return user;
}

export function isSameChat(
  chatJidA?: string | null,
  chatJidB?: string | null,
  phoneA?: string | null,
  phoneB?: string | null
): boolean {
  if (!chatJidA || !chatJidB) return false;
  if (chatJidA === chatJidB) return true;

  // Normalize device extensions (e.g. 628123:0@s.whatsapp.net -> 628123@s.whatsapp.net)
  const cleanA = chatJidA.includes(':') && chatJidA.includes('@') ? chatJidA.replace(/:[0-9]+@/, '@') : chatJidA;
  const cleanB = chatJidB.includes(':') && chatJidB.includes('@') ? chatJidB.replace(/:[0-9]+@/, '@') : chatJidB;
  if (cleanA === cleanB) return true;

  // Groups and Channels must match strictly
  if (cleanA.endsWith('@g.us') || cleanB.endsWith('@g.us') || cleanA.endsWith('@newsletter') || cleanB.endsWith('@newsletter')) {
    return cleanA === cleanB;
  }

  // Extract phone numbers from JID if available
  const digitsA = phoneA || parsePhoneFromJid(cleanA);
  const digitsB = phoneB || parsePhoneFromJid(cleanB);

  if (digitsA && digitsB) {
    return digitsA === digitsB;
  }

  if (digitsA && (cleanB.startsWith(digitsA) || cleanB.includes(digitsA))) return true;
  if (digitsB && (cleanA.startsWith(digitsB) || cleanA.includes(digitsB))) return true;

  return false;
}

const TWO_DIGIT_COUNTRY_CODE = /^(?:2[07]|3[0-469]|4[013-9]|5[1-8]|6[0-6]|8[1246]|9[0-58])/;

export function formatPhoneForDisplay(phoneOrJid: string): string {
  if (!phoneOrJid) return '';
  if (phoneOrJid.includes('@g.us')) return 'Grup WhatsApp';
  if (phoneOrJid.includes('@newsletter')) return 'Saluran WhatsApp';
  if (phoneOrJid.includes('broadcast')) return 'Status';
  if (phoneOrJid.includes('@lid')) return 'WhatsApp User (LID)';

  const digits = /^\d+$/.test(phoneOrJid) ? phoneOrJid : parsePhoneFromJid(phoneOrJid);
  if (!digits) {
    return phoneOrJid;
  }
  // Reject tokens longer than 15 digits (e.g. raw anonymous LID tokens)
  if (digits.length > 15) {
    return 'WhatsApp Contact';
  }
  if (digits.length <= 4) return `+${digits}`;

  let ccLen = 3;
  if (digits.length <= 6 || digits[0] === '1' || digits[0] === '7') ccLen = 1;
  else if (TWO_DIGIT_COUNTRY_CODE.test(digits)) ccLen = 2;

  const cc = digits.slice(0, ccLen);
  const rest = digits.slice(ccLen);
  if (rest.length <= 4) return `+${cc} ${rest}`;
  const last4 = rest.slice(-4);
  const prefix = rest.slice(0, -4);
  const prefixGroups = prefix.match(/.{1,3}/g) ?? [prefix];
  return `+${cc} ${[...prefixGroups, last4].join(' ')}`;
}

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES_ID = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

export function formatWhatsAppTimestamp(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Kemarin';
  }

  const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
  if (diffDays < 7) {
    return DAY_NAMES_ID[date.getDay()];
  }

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export function formatDateSeparator(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return 'HARI INI';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'KEMARIN';

  const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
  if (diffDays < 7) {
    return DAY_NAMES_ID[date.getDay()].toUpperCase();
  }

  return `${date.getDate()} ${MONTH_NAMES_ID[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Shared parser for "phone,name" recipient lines.
 * Used by both the Quick Chat Broadcast and New Campaign forms so their
 * name-parsing logic can never diverge again.
 */
export function parseRecipientLines(raw: string): Array<{ phone: string; name?: string; customVars: any }> {
  return raw
    .split('\n')
    .map(line => {
      const parts = line.split(',');
      const phone = parts[0]?.trim().replace(/[^0-9]/g, '');
      const name = parts[1]?.trim();
      if (!phone || phone.length < 7) return null;
      return { phone, name: name || undefined, customVars: {} };
    })
    .filter(Boolean) as Array<{ phone: string; name?: string; customVars: any }>;
}

export function getAvatarBgColor(str: string): string {
  if (!str) return '#00a884';
  const colors = [
    '#00a884', '#0284c7', '#7c3aed', '#db2777', '#ea580c', '#059669', '#d97706', '#4f46e5', '#0891b2', '#0d9488'
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
