import type { Plugin } from 'vite';

/**
 * ID unik per build. Disuntikkan ke kode sebagai __BUILD_ID__ dan ditulis ke
 * `version.json` agar aplikasi yang sedang terbuka bisa mendeteksi build baru.
 */
export const BUILD_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function buildVersionPlugin(fileName = 'version.json'): Plugin {
  return {
    name: 'pkm-build-version',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName,
        source: JSON.stringify({ build: BUILD_ID, builtAt: new Date().toISOString() }),
      });
    },
  };
}
