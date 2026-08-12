'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { addMonthsToMonthStr, monthLabel } from '@/lib/utils'

export function RangeNav({ startMonth, count, onChange }: { startMonth: string; count: number; onChange: (month: string) => void }) {
  const endMonth = addMonthsToMonthStr(startMonth, count - 1)

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button onClick={() => onChange(addMonthsToMonthStr(startMonth, -count))} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
        <ChevronsLeft className="w-4 h-4" />
      </button>
      <button onClick={() => onChange(addMonthsToMonthStr(startMonth, -1))} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium min-w-[168px] text-center capitalize px-2 py-1 rounded-full border border-border">
        {monthLabel(startMonth)} – {monthLabel(endMonth)}
      </span>
      <button onClick={() => onChange(addMonthsToMonthStr(startMonth, 1))} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
        <ChevronRight className="w-4 h-4" />
      </button>
      <button onClick={() => onChange(addMonthsToMonthStr(startMonth, count))} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
        <ChevronsRight className="w-4 h-4" />
      </button>
    </div>
  )
}
