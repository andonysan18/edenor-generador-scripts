import { formatIp, parseIp, subnetInfo } from './net';
import type { Errors, Field, Values } from '../templates/types';

const vlanOk = (x: string) => /^\d+$/.test(x) && +x >= 1 && +x <= 4094;

export function validate(fields: Field[], v: Values, prefix: number): Errors {
  const e: Errors = {};
  for (const f of fields) {
    if (f.type === 'vlan') {
      if (!v.vlanSel) e[f.id] = 'Seleccioná una combinación de VLAN';
      else if (!v.mg || !v.rt) e[f.id] = 'Ingresá la VLAN MGMT y la VLAN RTU';
      else if (!vlanOk(v.mg) || !vlanOk(v.rt)) e[f.id] = 'Las VLANs deben estar entre 1 y 4094';
      else if (v.mg === v.rt) e[f.id] = 'MGMT y RTU no pueden ser la misma VLAN';
      continue;
    }
    const val = v[f.id];
    if (!val) {
      if (f.required) e[f.id] = f.reqMsg || 'Campo obligatorio';
      continue;
    }
    if ((f.type === undefined || f.type === 'text') && f.pattern && !f.pattern.test(val)) {
      e[f.id] = f.patternMsg || 'Formato inválido';
      continue;
    }
    if (f.type === 'ip') {
      const n = parseIp(val);
      if (n === null) { e[f.id] = 'Dirección IP inválida'; continue; }
      const r = subnetInfo(n, prefix);
      if (n === r.n) e[f.id] = `Es la dirección de red de la /${prefix}`;
      else if (n === r.b) e[f.id] = `Es la dirección de broadcast de la /${prefix}`;
    }
    if (f.type === 'gateway') {
      const g = parseIp(val), n = parseIp(v[f.ipField] ?? '');
      if (g === null) { e[f.id] = 'Dirección IP inválida'; continue; }
      if (n !== null) {
        const r = subnetInfo(n, prefix);
        if (g === n) e[f.id] = 'El gateway no puede ser igual a la IP LAN';
        else if (g === r.n || g === r.b) e[f.id] = 'El gateway no puede ser la red ni el broadcast';
        else if ((g & r.m) >>> 0 !== r.n) e[f.id] = `Fuera de la subred ${formatIp(r.n)}/${prefix}`;
      }
    }
  }
  return e;
}
