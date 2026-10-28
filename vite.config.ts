import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import pkg from './package.json' with { type: 'json' };

// `vite build --mode single` genera un único HTML autocontenido que se abre con doble clic,
// igual que el scriptEdenor.html original.
export default defineConfig(({ mode }) => ({
  // Rutas relativas: el build funciona servido desde cualquier carpeta de la intranet.
  base: './',
  plugins: mode === 'single' ? [viteSingleFile()] : [],
  build: mode === 'single' ? { outDir: 'dist-single' } : {},
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
}));
