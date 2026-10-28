import type { IconName } from '../ui/icons';
import type { DeviceConfig } from '../config/device-config';

interface BaseField {
  id: string;
  label: string;
  required?: boolean;
  reqMsg?: string;
}

export interface TextField extends BaseField {
  type?: 'text';
  ph?: string;
  pattern?: RegExp;
  patternMsg?: string;
}

export interface IpField extends BaseField {
  type: 'ip';
  ph?: string;
}

export interface GatewayField extends BaseField {
  type: 'gateway';
  /** Campo IP del que se calcula el gateway automático. */
  ipField: string;
  ph?: string;
}

export interface VlanField extends BaseField {
  type: 'vlan';
  /** Combinaciones [MGMT, RTU] predefinidas. */
  presets: [number, number][];
}

export type Field = TextField | IpField | GatewayField | VlanField;

/**
 * Valores leídos del formulario. Además de un valor por campo incluye
 * `mask` (de la subred) y, si hay campo VLAN, `mg`, `rt` y `vlanSel`.
 */
export type Values = Record<string, string>;

export type Errors = Record<string, string>;

/** Marca un valor en el script: resaltado si existe, o un placeholder `<name>` si falta. */
export type Mark = (value: string | undefined, name?: string) => string;

export interface Generator {
  title: string;
  desc: string;
  /** Prefijo de la subred LAN, p. ej. 25 para /25. */
  prefix: number;
  fields: Field[];
  /** Claves de DeviceConfig que el script necesita. */
  requiredConfig: (keyof DeviceConfig)[];
  filename: (v: Values) => string;
  footer?: (v: Values) => string[];
  build: (v: Values, mark: Mark, cfg: DeviceConfig) => string;
}

export interface Template {
  id: string;
  name: string;
  icon: IconName;
  /** Sin generador la pestaña se muestra como "Pronto". */
  generator?: Generator;
}
