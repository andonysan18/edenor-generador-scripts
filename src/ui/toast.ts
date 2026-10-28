import { escapeHtml } from '../core/script';
import { icon } from './icons';

export function toast(msg: string, type: 'ok' | 'err') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = icon(type === 'ok' ? 'check' : 'alert') + `<span>${escapeHtml(msg)}</span>`;
  document.getElementById('toasts')!.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 200); }, 2600);
}
