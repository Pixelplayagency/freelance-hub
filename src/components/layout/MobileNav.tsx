'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './Sidebar'
import type { UserRole } from '@/lib/types/app.types'

export function MobileNav({ role, userName }: { role: UserRole; userName: string | null }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-60">
        <Sidebar role={role} userName={userName} />
      </SheetContent>
    </Sheet>
  )
}
