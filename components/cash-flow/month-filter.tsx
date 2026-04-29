'use client'

import { format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MonthFilterProps {
  currentMonth: Date
  onMonthChange: (date: Date) => void
}

export function MonthFilter({ currentMonth, onMonthChange }: MonthFilterProps) {
  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1))
  }
  
  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1))
  }
  
  const handleCurrentMonth = () => {
    onMonthChange(new Date())
  }
  
  return (
    <div className="flex items-center justify-between gap-2">
      <Button 
        variant="ghost" 
        size="icon-sm"
        onClick={handlePrevMonth}
        aria-label="Mes anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <button 
        onClick={handleCurrentMonth}
        className="px-3 py-1 text-sm font-medium capitalize hover:bg-accent rounded-md transition-colors"
      >
        {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
      </button>
      
      <Button 
        variant="ghost" 
        size="icon-sm"
        onClick={handleNextMonth}
        aria-label="Proximo mes"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
