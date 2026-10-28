/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_SECRET?: string;
  readonly VITE_ADMIN_USER?: string;
  readonly VITE_ADMIN_PASSWORD7?: string;
  readonly VITE_SNMP_COMMUNITY?: string;
  readonly VITE_SNMPV3_USER?: string;
  readonly VITE_SNMPV3_GROUP?: string;
  readonly VITE_SNMPV3_AUTH?: string;
  readonly VITE_SNMPV3_PRIV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
