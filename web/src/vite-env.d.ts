/// <reference types="vite/client" />

// Types the custom VITE_ variables so `import.meta.env.VITE_SUPABASE_URL` is a known string rather
// than `any`. The reference above pulls in Vite's built-in client types (import.meta.env, asset
// imports, etc.).
interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
