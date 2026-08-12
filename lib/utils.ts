import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtCurrency(v: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits }).format(v)
}

export function fmtCompact(v: number) {
  const abs = Math.abs(v)
  if (abs >= 1000) return `${(v / 1000).toFixed(abs >= 10000 ? 1 : 2).replace(/\.0$/, '')}K`
  return v.toFixed(1)
}

export const TAG_COLORS = [
  { key: 'rose', hex: '#f4a6b0' },
  { key: 'sand', hex: '#d8c3a5' },
  { key: 'pink', hex: '#f2b8d4' },
  { key: 'purple', hex: '#b9a6e0' },
  { key: 'green', hex: '#a8d5ba' },
  { key: 'blue', hex: '#a6c8e0' },
  { key: 'amber', hex: '#eecb8f' },
  { key: 'gray', hex: '#c9cdd3' },
] as const

export function tagColorHex(key: string) {
  return TAG_COLORS.find(c => c.key === key)?.hex ?? TAG_COLORS[7].hex
}

export function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMM/yyyy', { locale: ptBR })
}

export function monthLabelFull(month: string) {
  const [y, m] = month.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMMM \'de\' yyyy', { locale: ptBR })
}

export function addMonthsToMonthStr(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
