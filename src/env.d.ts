/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
}

declare namespace App {
  interface Locals {
    user: any;
    role: string;
  }
}