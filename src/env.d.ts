/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  readonly SUPABASE_SECRET_KEY?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly BENDAHARA_DEFAULT_REGU_ID?: string;
}

declare namespace App {
  interface Locals {
    user: any;
    role: string;
  }
}
