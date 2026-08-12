'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonthsToMonthStr, monthLabel } from '@/lib/utils'

export function MonthNav({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(addMonthsToMonthStr(month, -1))}
        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium min-w-[92px] text-center capitalize">{monthLabel(month)}</span>
      <button
        onClick={() => onChange(addMonthsToMonthStr(month, 1))}
        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
