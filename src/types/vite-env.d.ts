/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_URL: string;
  readonly VITE_DISABLE_AUTH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
