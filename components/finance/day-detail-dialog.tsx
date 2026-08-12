'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { KindIcon } from './kind-config'
import { useAppShell } from '@/components/layout/app-shell-context'
import { fmtCurrency } from '@/lib/utils'
import type { DayCell, Transaction } from '@/lib/types'

interface DayDetailDialogProps {
  cell: DayCell | null
  onClose: () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: { description?: string; amount?: number }) => Promise<void>
}

export function DayDetailDialog({ cell, onClose, onDelete, onUpdate }: DayDetailDialogProps) {
  const { openAddModal } = useAppShell()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')

  if (!cell) return null

  const startEdit = (t: Transaction) => {
    setEditingId(t.id)
    setEditDescription(t.description)
    setEditAmount(String(t.amount))
  }

  const saveEdit = async () => {
    if (!editingId) return
    await onUpdate(editingId, { description: editDescription, amount: Number(editAmount) })
    setEditingId(null)
  }

  const realTransactions = cell.transactions.filter(t => !t.isVirtual)

  return (
    <Dialog open={!!cell} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {format(parseISO(cell.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between text-sm bg-muted/40 rounded-xl px-3 py-2">
          <span className="text-muted-foreground">Saldo acumulado</span>
          <span className={cell.accumulatedBalance >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
            {fmtCurrency(cell.accumulatedBalance)}
          </span>
        </div>

        <div className="space-y-1.5 max-h-[45vh] overflow-y-auto">
          {realTransactions.length === 0 && cell.transactions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum lançamento neste dia</p>
          )}

          {cell.transactions.map(t => (
            <div key={t.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50">
              <KindIcon kind={t.kind} className="w-6 h-6" />
              {editingId === t.id ? (
                <div className="flex-1 flex items-center gap-1.5">
                  <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} className="h-8 text-xs" />
                  <Input type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="h-8 text-xs w-24" />
                  <Button size="icon-sm" variant="ghost" onClick={saveEdit}><Check className="w-3.5 h-3.5" /></Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    {t.tag && <p className="text-[11px] text-muted-foreground">{t.tag.name}</p>}
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{fmtCurrency(t.amount)}</span>
                  {!t.isVirtual && (
                    <div className="flex items-center gap-0.5">
                      <Button size="icon-sm" variant="ghost" onClick={() => startEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => onDelete(t.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full gap-1.5"
          onClick={() => { onClose(); openAddModal({ date: cell.date }) }}
        >
          <Plus className="w-4 h-4" /> Adicionar lançamento
        </Button>
      </DialogContent>
    </Dialog>
  )
}
