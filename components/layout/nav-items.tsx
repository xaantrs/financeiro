import { LayoutGrid, ListX, Tag, Grid3x3, Menu, CirclePlus, CalendarClock } from 'lucide-react'

export type NavItem =
  | { type: 'link'; id: string; href: string; label: string; icon: typeof LayoutGrid }
  | { type: 'menu'; id: string; label: string; icon: typeof LayoutGrid }
  | { type: 'action'; id: 'adicionar' | 'ir-pra-hoje'; label: string; icon: typeof LayoutGrid }

export const navItems: NavItem[] = [
  { type: 'link', id: 'saldos', href: '/saldos', label: 'saldos', icon: LayoutGrid },
  { type: 'link', id: 'totais', href: '/totais', label: 'totais', icon: ListX },
  { type: 'link', id: 'tags', href: '/tags', label: 'tags', icon: Tag },
  { type: 'menu', id: 'menu', label: 'menu', icon: Menu },
  { type: 'action', id: 'adicionar', label: 'adicionar', icon: CirclePlus },
  { type: 'action', id: 'ir-pra-hoje', label: 'ir pra hoje', icon: CalendarClock },
  { type: 'link', id: 'horizonte', href: '/saldos/horizonte', label: 'horizonte', icon: Grid3x3 },
]
