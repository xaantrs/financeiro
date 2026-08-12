import { Check, ArrowUpRight } from 'lucide-react'
import type { TransactionKind } from '@/lib/types'
import { cn } from '@/lib/utils'

export const kindConfig: Record<TransactionKind, {
  label: string // plural, usado em colunas/listas
  singular: string // usado no formulário
  description: string // usado no popover de escolha de tipo
  letter?: string
  colorClass: string
  bgClass: string
  textClass: string
}> = {
  entrada: { label: 'entradas', singular: 'entrada', description: 'salário, comissão, vales', colorClass: 'emerald', bgClass: 'bg-emerald-500', textClass: 'text-emerald-600' },
  saida: { label: 'saídas', singular: 'saída', description: 'gastos fixos, boletos, aluguel', colorClass: 'red', bgClass: 'bg-red-500', textClass: 'text-red-500' },
  diario: { label: 'diários', singular: 'diário', description: 'gastos variáveis, compras', letter: 'D', colorClass: 'pink', bgClass: 'bg-pink-500', textClass: 'text-pink-500' },
  economia: { label: 'economias', singular: 'economia', description: 'reserva, investimento', letter: 'E', colorClass: 'teal', bgClass: 'bg-teal-500', textClass: 'text-teal-600' },
  cartao: { label: 'cartão', singular: 'cartão', description: 'gastos ou total da fatura', letter: 'C', colorClass: 'violet', bgClass: 'bg-violet-500', textClass: 'text-violet-500' },
}

export const kindOrder: TransactionKind[] = ['entrada', 'saida', 'diario', 'economia', 'cartao']

export function KindIcon({ kind, className }: { kind: TransactionKind; className?: string }) {
  const cfg = kindConfig[kind]
  return (
    <span className={cn('inline-flex items-center justify-center rounded-full text-white shrink-0', cfg.bgClass, className ?? 'w-4 h-4')}>
      {kind === 'entrada' && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
      {kind === 'saida' && <ArrowUpRight className="w-2.5 h-2.5" strokeWidth={3} />}
      {cfg.letter && <span className="text-[9px] font-bold leading-none">{cfg.letter}</span>}
    </span>
  )
}
