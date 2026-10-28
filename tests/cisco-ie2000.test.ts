import { describe, expect, it } from 'vitest';
import { mark, toHighlightedLines, toPlainText } from '../src/core/script';
import { ciscoIe2000 } from '../src/templates/cisco-ie2000';
import type { DeviceConfig } from '../src/config/device-config';

// Credenciales de prueba: nunca usar las reales en los tests.
const cfg: DeviceConfig = {
  enableSecret: 'ENABLE', adminUser: 'admin', adminPassword7: 'PASS7',
  snmpCommunity: 'comunidad', snmpV3User: 'user', snmpV3Group: 'grupo', snmpV3Auth: 'AUTH', snmpV3Priv: 'PRIV',
  ntpServer: '192.168.142.60', domain: 'pro.edenor'
};

const values = { c1: 'CR Escobar', c2: 'A SE Maschwitz (B)', punto: '34018', ip: '10.100.178.70', gw: '10.100.178.126', mg: '134', rt: '34', vlanSel: '134|34', mask: '255.255.255.128' };

describe('script Cisco IE-2000', () => {
  const txt = toPlainText(ciscoIe2000.build(values, mark, cfg));

  it('genera el script completo', () => {
    expect(txt).toMatchSnapshot();
  });

  it('incluye los datos clave', () => {
    expect(txt).toContain('hostname SW-34018');
    expect(txt).toContain('ip address 10.100.178.70 255.255.255.128');
    expect(txt).toContain('ip default-gateway 10.100.178.126');
    expect(txt).toContain('switchport trunk allowed vlan 34,134');
    expect(txt).toContain(' description A CR Escobar\n');
    expect(txt).toContain(' description A SE Maschwitz (B)\n');
    expect(txt).not.toMatch(/[\u0001-\u0004]/);
  });

  it('usa el nombre de archivo del punto TLC', () => {
    expect(ciscoIe2000.filename(values)).toBe('SW-34018.txt');
    expect(ciscoIe2000.filename({})).toBe('script.txt');
  });

  it('muestra placeholders para datos faltantes y no los incluye en el archivo', () => {
    const raw = ciscoIe2000.build({ mask: '255.255.255.128' }, mark, cfg);
    expect(toHighlightedLines(raw).join('\n')).toContain('&lt;punto-tlc&gt;');
    expect(toPlainText(raw)).toContain('hostname \n');
  });
});
