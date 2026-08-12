'use client'

import { forwardRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface PopoverOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
}

interface OptionPopoverProps {
  options: PopoverOption[]
  value?: string
  onSelect: (value: string) => void
  trigger: React.ReactNode
  header?: string
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  footer?: React.ReactNode
}

export function OptionPopover({ options, value, onSelect, trigger, header, align = 'start', side, footer }: OptionPopoverProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} side={side} className="w-72 p-0 overflow-hidden">
        {header && (
          <div className="px-4 py-2.5 text-xs font-medium text-muted-foreground border-b border-border">{header}</div>
        )}
        <div className="py-1 max-h-80 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onSelect(opt.value); setOpen(false) }}
              className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-muted/60 text-left transition-colors"
            >
              {opt.icon}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{opt.label}</p>
                {opt.description && <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>}
              </div>
              {value === opt.value && <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5" />}
            </button>
          ))}
        </div>
        {footer}
      </PopoverContent>
    </Popover>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FieldRowProps = {
  icon: React.ReactNode
  children: React.ReactNode
  interactive?: boolean
  className?: string
} & Record<string, any>

export const FieldRow = forwardRef<HTMLElement, FieldRowProps>(
  ({ icon, children, interactive, className, ...rest }, ref) => {
    const Comp = (interactive ? 'button' : 'div') as 'button'
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        type={interactive ? 'button' : undefined}
        className={cn('w-full flex items-center gap-3 px-1 py-3 border-b border-border text-left', interactive && 'hover:bg-muted/40 transition-colors cursor-pointer', className)}
        {...rest}
      >
        <span className="text-muted-foreground shrink-0 w-5 flex items-center justify-center">{icon}</span>
        {children}
      </Comp>
    )
  },
)
FieldRow.displayName = 'FieldRow'
