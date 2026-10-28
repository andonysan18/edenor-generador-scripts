import type { Template } from './types';
import { ciscoIe2000 } from './cisco-ie2000';

/*
 * Para agregar un equipo nuevo: crear su carpeta en src/templates/ con
 * index.ts (campos) y script.ts (build), y asignarlo como `generator` acá.
 */
export const TEMPLATES: Template[] = [
  { id: 'nokia-sar', name: 'Nokia SAR', icon: 'server' },
  { id: 'cisco-ct', name: 'Switches de CT Cisco', icon: 'router', generator: ciscoIe2000 },
  { id: 'nokia-ct', name: 'Switches de CT Nokia', icon: 'server' },
  { id: 'cabecera', name: 'Cabecera de CT', icon: 'building' }
];
