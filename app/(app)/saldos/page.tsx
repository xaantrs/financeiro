'use client'

import { useMemo, useState } from 'react'
import { format, addMonths, startOfMonth } from 'date-fns'
import { useSaldos } from '@/hooks/use-saldos'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAppShell } from '@/components/layout/app-shell-context'
import { SaldosDesktop } from '@/components/finance/saldos-desktop'
import { SaldosMobile } from '@/components/finance/saldos-mobile'
import { DayDetailDialog } from '@/components/finance/day-detail-dialog'
import { RangeNav } from '@/components/finance/range-nav'
import { MonthNav } from '@/components/finance/month-nav'
import { addMonthsToMonthStr } from '@/lib/utils'
import type { DayCell, TransactionKind } from '@/lib/types'

const MONTHS_WINDOW = 12

export default function SaldosPage() {
  const isMobile = useIsMobile()
  const [startMonth, setStartMonth] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM'))
  const [selectedCell, setSelectedCell] = useState<DayCell | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')

  const rangeStart = `${startMonth}-01`
  const endMonth = addMonthsToMonthStr(startMonth, isMobile ? 0 : MONTHS_WINDOW - 1)
  const [ey, em] = endMonth.split('-').map(Number)
  const rangeEnd = `${endMonth}-${String(new Date(ey, em, 0).getDate()).padStart(2, '0')}`

  const { cells, updateTransaction, deleteTransaction, confirmDay } = useSaldos(rangeStart, rangeEnd)
  const { openAddModal } = useAppShell()

  const months = useMemo(() => {
    const byMonth = new Map<string, DayCell[]>()
    for (const c of cells) {
      const m = c.date.slice(0, 7)
      if (!byMonth.has(m)) byMonth.set(m, [])
      byMonth.get(m)!.push(c)
    }
    const result: { month: string; cells: DayCell[] }[] = []
    let cursor = new Date(parseInt(startMonth.slice(0, 4)), parseInt(startMonth.slice(5, 7)) - 1, 1)
    const count = isMobile ? 1 : MONTHS_WINDOW
    for (let i = 0; i < count; i++) {
      const m = format(cursor, 'yyyy-MM')
      result.push({ month: m, cells: byMonth.get(m) ?? [] })
      cursor = addMonths(cursor, 1)
    }
    return result
  }, [cells, startMonth, isMobile])

  const domainMax = useMemo(() => cells.reduce((max, c) => Math.max(max, Math.abs(c.accumulatedBalance)), 1000), [cells])

  const selectedCellLive = selectedCell ? cells.find(c => c.date === selectedCell.date) ?? null : null

  const handleToggleConfirm = (cell: DayCell) => {
    confirmDay(cell.date, cell.allConfirmed ? 'pendente' : 'confirmado')
  }

  const handleQuickAdd = (date: string, kind: TransactionKind) => {
    openAddModal({ date, kind })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-4 md:px-6 py-3 border-b border-border grid grid-cols-3 items-center">
        <h1 className="text-base md:text-lg font-semibold">saldos</h1>
        <div className="col-span-2 md:col-span-1 justify-self-end md:justify-self-center">
          {isMobile
            ? <MonthNav month={startMonth} onChange={setStartMonth} />
            : <RangeNav startMonth={startMonth} count={MONTHS_WINDOW} onChange={setStartMonth} />}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {isMobile
          ? <SaldosMobile cells={months[0]?.cells ?? []} today={today} onDayClick={setSelectedCell} onToggleConfirm={handleToggleConfirm} onQuickAdd={handleQuickAdd} />
          : <SaldosDesktop months={months} today={today} domainMax={domainMax} onDayClick={setSelectedCell} onToggleConfirm={handleToggleConfirm} onQuickAdd={handleQuickAdd} />}
      </div>

      <DayDetailDialog
        cell={selectedCellLive}
        onClose={() => setSelectedCell(null)}
        onDelete={id => { deleteTransaction(id) }}
        onUpdate={(id, updates) => updateTransaction(id, updates)}
      />
    </div>
  )
}
