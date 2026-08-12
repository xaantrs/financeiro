'use client'

import { useEffect, useMemo } from 'react'
import { balanceHeatColor } from '@/lib/heat'
import { fmtCompact, cn } from '@/lib/utils'
import { GO_TO_TODAY_EVENT } from '@/components/layout/app-shell-context'
import type { HorizonteMonth } from '@/lib/types'

export function HorizonteHeatmap({ months, today }: { months: HorizonteMonth[]; today: string }) {
  const domainMax = useMemo(() => {
    let max = 1000
    for (const m of months) for (const d of m.days) if (d.saldo !== null) max = Math.max(max, Math.abs(d.saldo))
    return max
  }, [months])

  const maxDays = 31

  useEffect(() => {
    const handler = () => document.getElementById(`horizonte-day-${today}`)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    window.addEventListener(GO_TO_TODAY_EVENT, handler)
    return () => window.removeEventListener(GO_TO_TODAY_EVENT, handler)
  }, [today])

  return (
    <div className="h-full overflow-auto">
      <div className="flex w-max">
        {months.map(m => (
          <div key={m.month} className="w-[104px] shrink-0 border-r border-border last:border-r-0">
            <div className="sticky top-0 z-10 bg-background px-2 py-2 border-b border-border text-center">
              <p className="text-xs font-semibold text-muted-foreground capitalize">{m.label}</p>
            </div>

            {Array.from({ length: maxDays }, (_, i) => i + 1).map(day => {
              const cell = m.days.find(d => d.day === day)
              if (!cell || cell.saldo === null) {
                return <div key={day} className="grid grid-cols-[32px_1fr] text-[11px] border-b border-border/30">
                  <span className="px-1.5 py-1 text-muted-foreground/30">{cell ? day : ''}</span>
                  <span className="px-1.5 py-1" />
                </div>
              }
              const isToday = cell.date === today
              const heat = balanceHeatColor(cell.saldo, domainMax)
              return (
                <div key={day} id={isToday ? `horizonte-day-${today}` : undefined} className="grid grid-cols-[32px_1fr] text-[11px] border-b border-border/30">
                  <span className={cn(
                    'flex items-center justify-center m-0.5 rounded font-semibold',
                    isToday ? 'bg-foreground text-background' : 'text-muted-foreground',
                  )}>
                    {day}
                  </span>
                  <span
                    className="flex items-center justify-end px-1.5 tabular-nums font-medium"
                    style={{ backgroundColor: heat.bg, color: heat.fg }}
                  >
                    {fmtCompact(cell.saldo)}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
