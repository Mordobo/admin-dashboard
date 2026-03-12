/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_AUTH_ADMIN_URL?: string;
  readonly VITE_ADMIN_SECRET: string;
  readonly VITE_DEV_SUPER_ADMIN_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
