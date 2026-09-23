/// <reference types="vite/client" />

// Types the custom VITE_ variables so `import.meta.env.VITE_SUPABASE_URL` is a known string rather
// than `any`. The reference above pulls in Vite's built-in client types (import.meta.env, asset
// imports, etc.).
interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
    // Optional: api.ts falls back to the local dev server when it's unset.
    readonly VITE_API_URL?: string;
    // Optional: the public demo account. When both are set, the sign-in page offers a one-click
    // way in. Deliberately public credentials — see web/.env.example.
    readonly VITE_DEMO_EMAIL?: string;
    readonly VITE_DEMO_PASSWORD?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
