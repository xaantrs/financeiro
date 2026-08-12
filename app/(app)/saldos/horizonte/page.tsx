'use client'

import { useHorizonte } from '@/hooks/use-horizonte'
import { HorizonteHeatmap } from '@/components/finance/horizonte-heatmap'

export default function HorizontePage() {
  const { months, today, isLoading } = useHorizonte()

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-4 md:px-6 py-3 border-b border-border">
        <h1 className="text-base md:text-lg font-semibold">horizonte de saldos</h1>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <HorizonteHeatmap months={months} today={today} />
        )}
      </div>
    </div>
  )
}
