/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional override for the backend API base URL in production.
   * When unset, the frontend falls back to the same-origin `/api` path
   * (which Vite proxies to FastAPI during local development).
   */
  readonly VITE_API_BASE_URL?: string;

  /**
   * Google Form URL for user feedback / review CTA.
   * Set to your Google Form share URL. Leave unset to hide the CTA.
   * e.g. VITE_REVIEW_FORM_URL=https://forms.gle/yourformid
   */
  readonly VITE_REVIEW_FORM_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
