/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IS_LOCAL_RUN: string;
  readonly VITE_USER_POOL_TOKEN_SIGNING_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
