/**
 * Message Parser Utility
 * Handles variable interpolation and Spintax parsing with strict precedence:
 * Variables ({var} and {{var}}) are resolved first, followed by Spintax ({opt1|opt2}).
 */

export function interpolateVariables(text: string, data: Record<string, any> = {}): string {
  if (!text) return '';
  let result = text;

  // Standardize common aliases in data
  const normalizedData: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null) {
      normalizedData[k.toLowerCase()] = String(v);
    }
  }

  // Alias support (nama <-> name, nomor <-> phone)
  if (normalizedData.name && !normalizedData.nama) normalizedData.nama = normalizedData.name;
  if (normalizedData.nama && !normalizedData.name) normalizedData.name = normalizedData.nama;
  if (normalizedData.phone && !normalizedData.nomor) normalizedData.nomor = normalizedData.phone;
  if (normalizedData.nomor && !normalizedData.phone) normalizedData.phone = normalizedData.nomor;

  // 1. Replace {{var}} (double curly braces)
  result = result.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
    const trimmed = key.trim().toLowerCase();
    if (normalizedData[trimmed] !== undefined) {
      return normalizedData[trimmed];
    }
    return match;
  });

  // 2. Replace {var} (single curly braces) ONLY when key matches a known data key (no pipe | inside)
  result = result.replace(/\{([^{}|]+)\}/g, (match, key) => {
    const trimmed = key.trim().toLowerCase();
    if (normalizedData[trimmed] !== undefined) {
      return normalizedData[trimmed];
    }
    return match;
  });

  return result;
}

export function parseSpintax(text: string): string {
  if (!text) return '';
  let res = text;
  // Match innermost {choice1|choice2} containing at least one '|'
  const spintaxRegex = /\{([^{}]+)\}/;
  let match: RegExpExecArray | null;
  let safetyCounter = 0;

  while ((match = spintaxRegex.exec(res)) !== null && safetyCounter < 50) {
    if (match[1].includes('|')) {
      const choices = match[1].split('|');
      const chosen = choices[Math.floor(Math.random() * choices.length)].trim();
      res = res.replace(match[0], chosen);
    } else {
      break;
    }
    safetyCounter++;
  }

  return res;
}

export function renderMessageTemplate(text: string, data: Record<string, any> = {}): string {
  if (!text) return '';
  const now = new Date();
  const defaultVars: Record<string, string> = {
    date: now.toLocaleDateString('id-ID'),
    time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    business_name: 'Bisnis Kami',
    agent: 'Customer Service'
  };

  const mergedData = { ...defaultVars, ...data };
  const withVariables = interpolateVariables(text, mergedData);
  return parseSpintax(withVariables);
}
