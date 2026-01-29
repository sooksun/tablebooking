import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Using untyped client for flexibility - types are enforced in api.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get public URL for uploaded files
export function getPublicUrl(path: string) {
  const { data } = supabase.storage.from('slips').getPublicUrl(path)
  return data.publicUrl
}
