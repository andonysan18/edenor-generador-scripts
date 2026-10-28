import type { Mark } from '../templates/types';

/*
 * Los generadores devuelven el script con marcadores de control:
 *   \u0001valor\u0002  -> valor ingresado (se resalta en la vista previa)
 *   \u0003<falta>\u0004 -> dato faltante (se muestra como placeholder y no va al archivo)
 */
const V_OPEN = '\u0001', V_CLOSE = '\u0002', X_OPEN = '\u0003', X_CLOSE = '\u0004';

export const mark: Mark = (s, name) =>
  s === '' || s == null ? `${X_OPEN}<${name || 'falta'}>${X_CLOSE}` : `${V_OPEN}${s}${V_CLOSE}`;

/** Texto final para descargar o copiar. */
export function toPlainText(raw: string): string {
  return raw.replace(/\u0003[^\u0004]*\u0004/g, '').replace(/[\u0001\u0002]/g, '');
}

const KW = /^(\s*)(interface|vlan|hostname|line|ip|no|username|enable|snmp-server|ntp|spanning-tree|service|version|crypto|alarm|syslog|notifies|lldp|system|do|switchport|description|shutdown|login|transport|name|boot-start-marker|boot-end-marker)\b/;

export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Una línea de HTML resaltado por cada línea del script. */
export function toHighlightedLines(raw: string): string[] {
  return raw.split('\n').map(l => {
    let h = escapeHtml(l);
    if (l.trim().startsWith('!')) h = `<span class="t-c">${h}</span>`;
    else h = h.replace(KW, '$1<span class="t-k">$2</span>');
    return h
      .replace(/\u0001/g, '<span class="t-v">')
      .replace(/\u0003/g, '<span class="t-x">')
      .replace(/[\u0002\u0004]/g, '</span>');
  });
}
