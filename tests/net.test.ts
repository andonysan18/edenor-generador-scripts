import { describe, expect, it } from 'vitest';
import { formatIp, lastHost, parseIp, prefixToMask, subnetInfo } from '../src/core/net';

describe('net', () => {
  it('parsea y formatea IPs', () => {
    expect(formatIp(parseIp('10.100.178.70')!)).toBe('10.100.178.70');
    expect(parseIp(' 192.168.0.1 ')).toBe(3232235521);
  });

  it.each(['', '10.0.0', '10.0.0.256', '10.0.0.a', '1.2.3.4.5', '10..0.1'])('rechaza %j', s => {
    expect(parseIp(s)).toBeNull();
  });

  it('calcula máscaras', () => {
    expect(formatIp(prefixToMask(25))).toBe('255.255.255.128');
    expect(formatIp(prefixToMask(0))).toBe('0.0.0.0');
    expect(formatIp(prefixToMask(32))).toBe('255.255.255.255');
  });

  it('calcula red, broadcast y último host de una /25', () => {
    const ip = parseIp('10.100.178.70')!;
    const r = subnetInfo(ip, 25);
    expect(formatIp(r.n)).toBe('10.100.178.0');
    expect(formatIp(r.b)).toBe('10.100.178.127');
    expect(formatIp(lastHost(ip, 25))).toBe('10.100.178.126');
  });
});
