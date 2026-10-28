import type { Generator } from '../types';
import { buildCiscoIe2000 } from './script';

export const ciscoIe2000: Generator = {
  title: 'Switch para CTs Cisco IE-2000',
  desc: 'Completá los datos y el script se genera en vivo.',
  prefix: 25,
  fields: [
    { id: 'c1', label: 'Cabecera 1', ph: 'CR Escobar' },
    { id: 'c2', label: 'Cabecera 2', ph: 'SE Maschwitz (B)' },
    { id: 'punto', label: 'Punto TLC', ph: '34018', required: true, reqMsg: 'Ingresá el punto TLC',
      pattern: /^[\w.-]+$/, patternMsg: 'Solo letras, números, guiones o puntos' },
    { id: 'ip', label: 'IP Lan', type: 'ip', ph: '10.100.178.70', required: true, reqMsg: 'Ingresá la IP LAN' },
    { id: 'gw', label: 'Gateway', type: 'gateway', ipField: 'ip', ph: 'Se completa con la IP Lan', required: true, reqMsg: 'Ingresá el gateway' },
    { id: 'vlan', label: 'VLAN', type: 'vlan', required: true,
      presets: [[134, 34], [135, 35], [136, 36], [137, 37], [138, 38], [139, 39]] }
  ],
  requiredConfig: ['enableSecret', 'adminUser', 'adminPassword7', 'snmpCommunity', 'snmpV3User', 'snmpV3Group', 'snmpV3Auth', 'snmpV3Priv'],
  filename: v => v.punto ? `SW-${v.punto}.txt` : 'script.txt',
  footer: v => [`MGMT ${v.mg || '—'} · RTU ${v.rt || '—'}`, 'IE-2000 · IOS 15.2'],
  build: buildCiscoIe2000
};
