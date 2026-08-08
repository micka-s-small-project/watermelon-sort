/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_GAME_VERSION?: string;
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
