import { describe, expect, it } from 'vitest';
import { validate } from '../src/core/validate';
import { ciscoIe2000 } from '../src/templates/cisco-ie2000';

const ok = { c1: '', c2: '', punto: '34018', ip: '10.100.178.70', gw: '10.100.178.126', mg: '134', rt: '34', vlanSel: '134|34', mask: '255.255.255.128' };
const check = (over: Record<string, string>) => validate(ciscoIe2000.fields, { ...ok, ...over }, 25);

describe('validate (Cisco IE-2000)', () => {
  it('acepta datos válidos', () => {
    expect(check({})).toEqual({});
  });

  it('exige los campos obligatorios', () => {
    expect(Object.keys(check({ punto: '', ip: '', gw: '', vlanSel: '', mg: '', rt: '' })).sort())
      .toEqual(['gw', 'ip', 'punto', 'vlan']);
  });

  it('valida el formato del punto TLC', () => {
    expect(check({ punto: 'CT 34' }).punto).toMatch(/Solo letras/);
  });

  it('rechaza red y broadcast como IP LAN', () => {
    expect(check({ ip: '10.100.178.0' }).ip).toMatch(/red/);
    expect(check({ ip: '10.100.178.127' }).ip).toMatch(/broadcast/);
  });

  it('valida el gateway contra la subred', () => {
    expect(check({ gw: '10.100.178.70' }).gw).toMatch(/igual a la IP/);
    expect(check({ gw: '10.100.178.200' }).gw).toMatch(/Fuera de la subred/);
    expect(check({ gw: '10.100.178.127' }).gw).toMatch(/broadcast/);
  });

  it('valida VLANs manuales', () => {
    expect(check({ vlanSel: 'manual', mg: '5000', rt: '34' }).vlan).toMatch(/1 y 4094/);
    expect(check({ vlanSel: 'manual', mg: '34', rt: '34' }).vlan).toMatch(/misma VLAN/);
    expect(check({ vlanSel: 'manual', mg: '', rt: '34' }).vlan).toMatch(/Ingresá/);
  });
});
