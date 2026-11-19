/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_ROOM_SERVER_HOST?: string;
  readonly NEXT_PUBLIC_PARTYKIT_HOST?: string;
}

// The synced sm-core loader is plain JavaScript with no declaration file.
declare module "*/sm-posthog.js" {
  export function startPostHog(config: {
    token: string;
    product: string;
    host?: string;
    flags?: boolean;
    options?: Record<string, unknown>;
    idleMs?: number;
  }): void;
  export function flag(key: string): string | boolean | undefined;
  export function onFlags(cb: (values: Record<string, string | boolean>) => void): () => void;
  export function capture(event: string, properties?: Record<string, unknown>): void;
}
