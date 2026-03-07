'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { createContext, useContext, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type SupabaseContextType = {
  supabase: SupabaseClient
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createSupabaseBrowserClient())

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) throw new Error('useSupabase must be used within SupabaseProvider')
  return context.supabase
}
