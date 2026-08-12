'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { navItems } from './nav-items'
import { useAppShell, goToToday } from './app-shell-context'
import { cn } from '@/lib/utils'
import { Menu as MenuIcon, LogOut, Wallet } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { openAddModal } = useAppShell()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
          <Wallet className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-semibold text-sm">App Financeiro</span>
      </div>

      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-64 p-0">
          <SheetHeader className="border-b border-border py-3">
            <SheetTitle className="text-sm">Menu</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-0.5 px-2 py-2">
            {navItems.map(item => {
              if (item.type === 'link') {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      active ? 'text-orange-500 bg-orange-500/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              }

              if (item.type === 'menu') {
                return (
                  <button
                    key={item.id}
                    onClick={() => { setOpen(false); handleLogout() }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <LogOut className="w-4 h-4 shrink-0" /> Sair
                  </button>
                )
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setOpen(false)
                    if (item.id === 'adicionar') openAddModal()
                    else goToToday()
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
