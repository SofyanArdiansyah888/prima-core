/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

/** ID build saat ini (diisi Vite, lihat build-version.ts). */
declare const __BUILD_ID__: string;
