/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional override for the backend API base URL in production.
   * When unset, the frontend falls back to the same-origin `/api` path
   * (which Vite proxies to FastAPI during local development).
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
