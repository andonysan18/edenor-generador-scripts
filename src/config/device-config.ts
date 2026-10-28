/*
 * Configuración compartida por todos los equipos.
 * Las credenciales vienen de variables de entorno (.env.local, que no se sube al repo)
 * y se incrustan en el build: no publicar el build fuera de la red interna.
 */
export interface DeviceConfig {
  enableSecret: string;
  adminUser: string;
  adminPassword7: string;
  snmpCommunity: string;
  snmpV3User: string;
  snmpV3Group: string;
  snmpV3Auth: string;
  snmpV3Priv: string;
  ntpServer: string;
  domain: string;
}

const env = import.meta.env;

export const deviceConfig: DeviceConfig = {
  enableSecret: env.VITE_ENABLE_SECRET ?? '',
  adminUser: env.VITE_ADMIN_USER ?? '',
  adminPassword7: env.VITE_ADMIN_PASSWORD7 ?? '',
  snmpCommunity: env.VITE_SNMP_COMMUNITY ?? '',
  snmpV3User: env.VITE_SNMPV3_USER ?? '',
  snmpV3Group: env.VITE_SNMPV3_GROUP ?? '',
  snmpV3Auth: env.VITE_SNMPV3_AUTH ?? '',
  snmpV3Priv: env.VITE_SNMPV3_PRIV ?? '',
  ntpServer: '192.168.142.60',
  domain: 'pro.edenor'
};

export function missingConfig(cfg: DeviceConfig, keys: (keyof DeviceConfig)[]): (keyof DeviceConfig)[] {
  return keys.filter(k => !cfg[k]);
}
