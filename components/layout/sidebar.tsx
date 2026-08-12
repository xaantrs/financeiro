'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { navItems } from './nav-items'
import { goToToday } from './app-shell-context'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, LogOut, Wallet } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AddKindPopover } from '@/components/finance/add-kind-popover'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 border-r border-border bg-background h-dvh sticky top-0 transition-[width] duration-200',
        collapsed ? 'w-[64px]' : 'w-[156px]',
      )}
    >
      <div className="flex items-center gap-2 px-3.5 py-4">
        <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        {!collapsed && <span className="font-semibold text-sm truncate">App Financeiro</span>}
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {navItems.map(item => {
          if (item.type === 'link') {
            const active = pathname === item.href
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                  active ? 'text-orange-500 bg-orange-500/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          }

          if (item.type === 'menu') {
            return (
              <DropdownMenu key={item.id}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <item.icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }

          const actionButton = (
            <button
              onClick={item.id === 'ir-pra-hoje' ? goToToday : undefined}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <item.icon className={cn('w-4 h-4 shrink-0', item.id === 'adicionar' && 'text-foreground')} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )

          if (item.id === 'adicionar') {
            return <AddKindPopover key={item.id} side="right" align="start" trigger={actionButton} />
          }

          return <div key={item.id}>{actionButton}</div>
        })}
      </nav>

      <button
        onClick={() => setCollapsed(c => !c)}
        className="m-2 p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground self-start"
        title={collapsed ? 'Expandir' : 'Recolher'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}
