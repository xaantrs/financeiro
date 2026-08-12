'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { KindIcon, kindConfig } from './kind-config'
import { fmtCurrency, cn } from '@/lib/utils'
import type { MonthTotais, Transaction } from '@/lib/types'

function FormulaIcons({ kinds, projected }: { kinds: ('entrada' | 'saida' | 'diario' | 'economia' | 'cartao')[]; projected?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {kinds.map((k, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted-foreground text-xs">{i === 1 ? '' : '−'}</span>}
          <KindIcon kind={k} className="w-3.5 h-3.5" />
        </span>
      ))}
      {projected && (
        <>
          <span className="text-muted-foreground text-xs">−</span>
          <span className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-pink-400 flex items-center justify-center text-[8px] font-bold text-pink-500">D</span>
        </>
      )}
    </div>
  )
}

export function TotaisView({ totais, movimentacoes }: { totais: MonthTotais; movimentacoes: Transaction[] }) {
  const [showAll, setShowAll] = useState(false)

  const performancePositive = totais.performance >= 0
  const custoDentro = totais.custoDeVida <= totais.entradas
  const economizadoBom = totais.economizadoPct >= 20
  const economizadoOk = totais.economizadoPct >= 10

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 space-y-5">
      <div>
        <p className="text-sm text-muted-foreground mb-3">cálculos do mês</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border p-4">
            <p className="text-sm font-medium mb-2">performance</p>
            <FormulaIcons kinds={['entrada', 'saida', 'diario', 'economia', 'cartao']} projected />
            <p className={cn('text-2xl font-bold tabular-nums', performancePositive ? 'text-emerald-600' : 'text-red-500')}>
              {fmtCurrency(totais.performance, 2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{performancePositive ? 'sobrou dinheiro' : 'faltou dinheiro'}</p>
          </div>

          <div className="rounded-2xl border border-border p-4">
            <p className="text-sm font-medium mb-2">economizado</p>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
              <div
                className={cn('h-full rounded-full', economizadoBom ? 'bg-emerald-500' : economizadoOk ? 'bg-amber-500' : 'bg-red-500')}
                style={{ width: `${Math.min(totais.economizadoPct * 4, 100)}%` }}
              />
            </div>
            <p className={cn('text-2xl font-bold tabular-nums', economizadoBom ? 'text-emerald-600' : economizadoOk ? 'text-amber-500' : 'text-red-500')}>
              {totais.economizadoPct.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">{economizadoBom ? 'dentro do ideal' : economizadoOk ? 'quase lá' : 'abaixo do ideal'}</p>
          </div>

          <div className="rounded-2xl border border-border p-4">
            <p className="text-sm font-medium mb-2">custo de vida</p>
            <FormulaIcons kinds={['saida', 'diario', 'cartao']} projected />
            <p className="text-2xl font-bold tabular-nums">{fmtCurrency(totais.custoDeVida, 2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{custoDentro ? 'dentro da renda' : 'acima da renda'}</p>
          </div>

          <div className="rounded-2xl border border-border p-4">
            <p className="text-sm font-medium mb-2">diário médio</p>
            <div className="flex items-center gap-1.5 mb-2">
              <KindIcon kind="diario" className="w-3.5 h-3.5" />
              <span className="text-muted-foreground text-xs">/ {totais.diaAtual || 1}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{fmtCurrency(totais.diarioMedio, 2)}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <KindIcon kind="diario" className="w-3 h-3" /> {fmtCurrency(totais.diarioFixoAtual, 2)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-3">movimentações do mês</p>
        <div className="rounded-2xl border border-border divide-y divide-border">
          {([
            { kind: 'entrada' as const, label: 'entradas', value: totais.entradas },
            { kind: 'saida' as const, label: 'saídas', value: totais.saidas },
            { kind: 'diario' as const, label: 'diários', value: totais.diarios },
            { kind: 'economia' as const, label: 'economias', value: totais.economias },
            { kind: 'cartao' as const, label: 'gastos com cartão', value: totais.cartao },
          ]).map(row => (
            <div key={row.kind} className="flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2 text-sm">
                <KindIcon kind={row.kind} className="w-4 h-4" /> {row.label}
              </span>
              <span className={cn('text-sm font-semibold tabular-nums', kindConfig[row.kind].textClass)}>{fmtCurrency(row.value, 2)}</span>
            </div>
          ))}

          <button onClick={() => setShowAll(v => !v)} className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted/50">
            ver todas {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showAll && (
          <div className="mt-2 rounded-2xl border border-border divide-y divide-border max-h-96 overflow-y-auto">
            {movimentacoes.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum lançamento</p>}
            {movimentacoes.map(t => (
              <div key={t.id} className="flex items-center gap-2.5 px-4 py-2.5">
                <KindIcon kind={t.kind} className="w-5 h-5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.description}</p>
                  <p className="text-[11px] text-muted-foreground">{t.date.split('-').reverse().join('/')}{t.tag ? ` · ${t.tag.name}` : ''}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{fmtCurrency(t.amount, 2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
