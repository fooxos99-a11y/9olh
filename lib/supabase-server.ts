import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

export async function createClient() {
  return createSupabaseServerClient()
}

export async function getSupabaseServer() {
  return createSupabaseServerClient()
}
