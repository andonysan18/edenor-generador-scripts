import { formatIp, lastHost, parseIp, prefixToMask, subnetInfo } from '../core/net';
import { validate } from '../core/validate';
import { escapeHtml, mark, toHighlightedLines, toPlainText } from '../core/script';
import { deviceConfig, missingConfig } from '../config/device-config';
import { TEMPLATES } from '../templates';
import type { Errors, Field, GatewayField, Generator, Template, Values } from '../templates/types';
import { icon } from './icons';
import { toast } from './toast';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const input = (id: string) => $<HTMLInputElement>(id);

const TAB_KEY = 'gs-tab';

let cur: Template;
let gen: Generator | undefined;
let state = { touched: {} as Record<string, boolean>, submitted: false, gwAuto: {} as Record<string, boolean> };
let TXT = '', FILE = '';
let ERR: Errors = {};

const gateways = (g: Generator) => g.fields.filter((f): f is GatewayField => f.type === 'gateway');

function resetState() {
  state = { touched: {}, submitted: false, gwAuto: {} };
  if (gen) gateways(gen).forEach(f => (state.gwAuto[f.id] = true));
}

/* ---------- Pestañas ---------- */
function renderTabs() {
  $('tabs').innerHTML = TEMPLATES.map(t => `
    <button class="tab" role="tab" data-t="${t.id}" aria-selected="${cur && cur.id === t.id}">
      ${icon(t.icon, 17)}<span>${t.name}</span>${t.generator ? '' : '<span class="soon">Pronto</span>'}
    </button>`).join('');
  $('tabs').querySelectorAll<HTMLButtonElement>('.tab').forEach(b => (b.onclick = () => selectTemplate(b.dataset.t!)));
}

export function selectTemplate(id: string | null) {
  cur = TEMPLATES.find(t => t.id === id) || TEMPLATES.find(t => t.generator)!;
  gen = cur.generator;
  try { localStorage.setItem(TAB_KEY, cur.id); } catch { /* sin storage */ }
  renderTabs();
  if (!gen) {
    $('view').innerHTML = `
      <div class="card empty">
        <div class="empty-icon">${icon('filePlus', 24)}</div>
        <h2>${cur.name}</h2>
        <p>Plantilla en preparación. Este generador va a estar disponible próximamente.</p>
      </div>`;
    return;
  }
  resetState();
  renderLayout(gen);
  render();
}

/* ---------- Formulario ---------- */
function fieldHTML(f: Field) {
  const req = f.required ? '<span class="req">*</span>' : '';
  if (f.type === 'vlan') {
    const opts = f.presets.map(([m, r]) => `<option value="${m}|${r}">MGMT: ${m}  ·  RTU: ${r}</option>`).join('');
    return `
      <div class="field">
        <label for="f-${f.id}">${f.label}${req}</label>
        <select class="select" id="f-${f.id}" data-f="${f.id}">
          <option value="">-- Seleccionar VLAN --</option>${opts}
          <option value="manual">Manual (otra combinación)</option>
        </select>
        <div class="manual" id="m-${f.id}">
          <input class="input" id="f-${f.id}-mg" data-f="${f.id}" data-sub="mg" inputmode="numeric" placeholder="VLAN MGMT" aria-label="VLAN MGMT">
          <input class="input" id="f-${f.id}-rt" data-f="${f.id}" data-sub="rt" inputmode="numeric" placeholder="VLAN RTU" aria-label="VLAN RTU">
        </div>
        <p class="error" id="e-${f.id}"></p>
      </div>`;
  }
  const isGw = f.type === 'gateway';
  const numeric = f.type === 'ip' || isGw ? 'inputmode="decimal"' : '';
  const autoBtn = isGw
    ? `<button type="button" class="auto-btn on" id="a-${f.id}" title="Calcular automáticamente desde la IP">${icon('wand', 14)}AUTO</button>`
    : '';
  return `
    <div class="field">
      <label for="f-${f.id}">${f.label}${req}</label>
      <div class="control">
        <input class="input${isGw ? ' has-auto' : ''}" id="f-${f.id}" data-f="${f.id}" placeholder="${f.ph || ''}" spellcheck="false" ${numeric}>
        ${autoBtn}
      </div>
      <p class="hint" id="h-${f.id}"></p>
      <p class="error" id="e-${f.id}"></p>
    </div>`;
}

function renderLayout(g: Generator) {
  // Ojo: ningún control del form puede tener id/name "reset" o "submit",
  // porque taparían form.reset() / form.submit().
  $('view').innerHTML = `
    <div class="layout">
      <section class="card">
        <div class="card-head">
          <h2 class="card-title">${g.title}</h2>
          <p class="card-desc">${g.desc}</p>
        </div>
        <form class="card-body" id="form" novalidate autocomplete="off">
          ${g.fields.map(fieldHTML).join('')}
          <div class="actions">
            <button type="submit" class="btn btn-primary">${icon('download')}Descargar script</button>
            <button type="button" class="btn btn-icon" id="btn-clear" title="Limpiar campos" aria-label="Limpiar campos">${icon('eraser')}</button>
          </div>
        </form>
      </section>
      <section class="card preview" aria-label="Vista previa del script">
        <div class="preview-head">
          <div class="file">${icon('fileCode')}<span class="filename" id="fname"></span></div>
          <span class="pill" id="status"></span>
          <div class="spacer"></div>
          <button type="button" class="btn btn-sm" id="copy">${icon('copy', 16)}<span>Copiar</span></button>
        </div>
        <pre class="code" id="code"></pre>
        <div class="preview-foot" id="pfoot"></div>
      </section>
    </div>`;

  const form = $<HTMLFormElement>('form');
  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);
  form.addEventListener('focusout', onBlur);
  form.addEventListener('submit', e => { e.preventDefault(); download(); });
  $('btn-clear').onclick = resetForm;
  $('copy').onclick = copy;
  gateways(g).forEach(f => {
    $('a-' + f.id).onclick = () => { state.gwAuto[f.id] = true; calcGateway(f); updateAutoBtn(f); render(); };
  });
}

function read(g: Generator): Values {
  const v: Values = { mask: formatIp(prefixToMask(g.prefix)) };
  for (const f of g.fields) {
    if (f.type === 'vlan') {
      const sel = input('f-' + f.id).value;
      let mg = '', rt = '';
      if (sel === 'manual') { mg = input(`f-${f.id}-mg`).value.trim(); rt = input(`f-${f.id}-rt`).value.trim(); }
      else if (sel) [mg, rt] = sel.split('|');
      Object.assign(v, { mg, rt, vlanSel: sel });
    } else {
      v[f.id] = input('f-' + f.id).value.trim();
    }
  }
  return v;
}

/* ---------- Render ---------- */
function render() {
  if (!gen) return;
  const v = read(gen);
  ERR = validate(gen.fields, v, gen.prefix);

  for (const f of gen.fields) {
    const show = (state.touched[f.id] || state.submitted) && ERR[f.id];
    $('e-' + f.id).innerHTML = show ? icon('alert', 14) + ERR[f.id] : '';
    $('f-' + f.id).classList.toggle('invalid', !!show && !(f.type === 'vlan' && v.vlanSel === 'manual'));
    if (f.type === 'vlan') (['mg', 'rt'] as const).forEach(s =>
      $(`f-${f.id}-${s}`).classList.toggle('invalid', !!show && v.vlanSel === 'manual'));
  }

  for (const f of gen.fields) {
    const h = $('h-' + f.id);
    if (!h) continue;
    h.textContent = '';
    if (f.type === 'ip' && !ERR[f.id] && v[f.id]) {
      const r = subnetInfo(parseIp(v[f.id])!, gen.prefix);
      h.textContent = `Red ${formatIp(r.n)}/${gen.prefix} · Broadcast ${formatIp(r.b)}`;
    }
    if (f.type === 'gateway' && state.gwAuto[f.id] && v[f.id] && !ERR[f.id]) {
      h.textContent = `Último host utilizable de la /${gen.prefix}`;
    }
  }

  const raw = gen.build(v, mark, deviceConfig);
  TXT = toPlainText(raw);
  const lines = toHighlightedLines(raw);
  $('code').innerHTML = lines.map(h => `<span class="ln">${h || ' '}</span>`).join('');

  FILE = gen.filename(v);
  $('fname').textContent = FILE;
  const n = Object.keys(ERR).length, st = $('status');
  st.className = 'pill ' + (n ? 'warn' : 'ok');
  st.textContent = n ? `${n} ${n > 1 ? 'campos pendientes' : 'campo pendiente'}` : 'Listo para descargar';
  $('pfoot').innerHTML = [`${lines.length} líneas`, ...(gen.footer ? gen.footer(v) : [])]
    .map(x => `<span>${escapeHtml(x)}</span>`).join('');
}

/* ---------- Eventos ---------- */
function onInput(e: Event) {
  const el = e.target as HTMLInputElement | HTMLSelectElement;
  const id = el.dataset.f;
  if (!id || !gen) return;
  const f = gen.fields.find(x => x.id === id)!;

  if (f.type === 'vlan') {
    if (el.dataset.sub) {
      el.value = el.value.replace(/\D/g, '').slice(0, 4);
    } else {
      const manual = el.value === 'manual';
      $('m-' + id).classList.toggle('show', manual);
      if (manual && e.type === 'change') input(`f-${id}-mg`).focus();
      if (!manual && e.type === 'change') state.touched[id] = true;
    }
  }
  if (f.type === 'gateway' && e.type === 'input') {
    state.gwAuto[id] = el.value.trim() === '';
    updateAutoBtn(f);
  }
  if (f.type === 'ip') {
    gateways(gen).filter(g => g.ipField === id && state.gwAuto[g.id]).forEach(calcGateway);
  }
  render();
}

function onBlur(e: FocusEvent) {
  const el = e.target as HTMLInputElement | HTMLSelectElement;
  const id = el.dataset.f;
  if (!id) return;
  if (el.tagName === 'SELECT' && el.value === 'manual') return;
  if (el.dataset.sub === 'mg') return;
  state.touched[id] = true;
  render();
}

function calcGateway(g: GatewayField) {
  const n = parseIp(input('f-' + g.ipField).value);
  input('f-' + g.id).value = n === null ? '' : formatIp(lastHost(n, gen!.prefix));
}

function updateAutoBtn(g: GatewayField) { $('a-' + g.id).classList.toggle('on', !!state.gwAuto[g.id]); }

function resetForm() {
  if (!gen) return;
  $<HTMLFormElement>('form').reset();
  gen.fields.filter(f => f.type === 'vlan').forEach(f => $('m-' + f.id).classList.remove('show'));
  resetState();
  gateways(gen).forEach(updateAutoBtn);
  render();
  $('f-' + gen.fields[0].id).focus();
  toast('Campos limpiados', 'ok');
}

function guard(): boolean {
  if (!gen) return false;
  const missing = missingConfig(deviceConfig, gen.requiredConfig);
  if (missing.length) {
    toast(`Falta configurar credenciales (.env.local): ${missing.join(', ')}`, 'err');
    return false;
  }
  state.submitted = true;
  render();
  const first = gen.fields.find(f => ERR[f.id]);
  if (!first) return true;
  toast('Completá o corregí los campos marcados', 'err');
  const el = first.type === 'vlan' && input('f-' + first.id).value === 'manual' ? $(`f-${first.id}-mg`) : $('f-' + first.id);
  el.focus();
  return false;
}

function download() {
  if (!guard()) return;
  const url = URL.createObjectURL(new Blob([TXT], { type: 'text/plain;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: FILE });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`Descargado ${FILE}`, 'ok');
}

async function copy() {
  if (!guard()) return;
  try {
    await navigator.clipboard.writeText(TXT);
  } catch {
    const t = Object.assign(document.createElement('textarea'), { value: TXT });
    document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
  }
  toast('Script copiado al portapapeles', 'ok');
}

export function startApp() {
  $('logo').innerHTML = icon('fileCode', 22);
  $('version').textContent = `Generador de Scripts · v${__APP_VERSION__}`;
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (gen) download();
    }
  });
  let saved: string | null = null;
  try { saved = localStorage.getItem(TAB_KEY); } catch { /* sin storage */ }
  selectTemplate(saved || 'cisco-ct');
}
