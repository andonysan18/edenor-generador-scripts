# Generador de Scripts · Edenor

Herramienta web para generar los scripts de configuración de equipos de red de los CTs
(hoy: switch Cisco IE-2000). Completás los datos, el script se arma en vivo y lo descargás o copiás.

## Requisitos

- Node.js 22 o superior

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar con las credenciales reales
npm run dev                  # http://localhost:5173
```

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm test` | Corre los tests (red, validaciones y script generado) |
| `npm run typecheck` | Chequeo de tipos de TypeScript |
| `npm run build` | Build para publicar en un servidor web (`dist/`) |
| `npm run build:single` | Un único HTML autocontenido que se abre con doble clic (`dist-single/index.html`) |

## Estructura

```
src/
  core/          lógica pura, sin DOM (fácil de testear)
    net.ts         cálculos IPv4: máscara, red, broadcast, gateway
    validate.ts    validación de campos
    script.ts      marcado, resaltado y texto final del script
  config/
    device-config.ts  credenciales (desde .env.local) y datos comunes: NTP, dominio
  templates/     una carpeta por equipo
    types.ts       tipos de campos y generadores
    index.ts       lista de pestañas
    cisco-ie2000/  campos (index.ts) y plantilla del script (script.ts)
  ui/            interfaz: formulario, vista previa, toasts, íconos
  styles/
tests/           tests con Vitest
```

## Agregar un equipo nuevo

1. Crear `src/templates/<equipo>/script.ts` con una función `build(values, mark, cfg)` que devuelva el script.
   Envolver con `mark(valor, 'nombre')` cada dato ingresado por el usuario para que se resalte
   (o aparezca como `<nombre>` si falta).
2. Crear `src/templates/<equipo>/index.ts` con el `Generator`: título, prefijo de la subred, campos,
   credenciales requeridas, nombre de archivo y `build`.
3. Asignarlo como `generator` de su pestaña en `src/templates/index.ts`.
4. Agregar un test en `tests/` con un caso real (ver `tests/cisco-ie2000.test.ts`).

## Credenciales

Las credenciales de los equipos **no** están en el código: se leen de `.env.local`, que está en
`.gitignore`. Ojo: Vite las incrusta en el build, así que el contenido de `dist/` y `dist-single/`
es sensible y solo debe publicarse dentro de la red interna. Si falta alguna, la app no deja
descargar el script y avisa cuál falta.

## Próximos pasos posibles

- Plantillas Nokia SAR, Nokia CT y Cabecera de CT.
- Backend (por ejemplo Supabase) para login, historial de scripts generados y credenciales
  guardadas del lado servidor, para que no viajen en el build.
