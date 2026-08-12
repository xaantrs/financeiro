'use client'

import { useEffect, useState } from 'react'
import { mutate } from 'swr'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Receipt, Pencil, CalendarIcon, Repeat, TagIcon, ChevronDown, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { OptionPopover, FieldRow } from './option-popover'
import { useTags } from '@/hooks/use-tags'
import { kindConfig, kindOrder, KindIcon } from './kind-config'
import { recurrenceConfig, recurrenceOrder } from './recurrence-config'
import type { Recurrence, TransactionKind } from '@/lib/types'
import { cn, TAG_COLORS } from '@/lib/utils'

interface AddTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: string
  defaultKind?: TransactionKind
}

export function AddTransactionModal({ open, onOpenChange, defaultDate, defaultKind }: AddTransactionModalProps) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [kind, setKind] = useState<TransactionKind>(defaultKind ?? 'entrada')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(defaultDate ?? today)
  const [tagId, setTagId] = useState<string>('none')
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [newTagName, setNewTagName] = useState('')
  const [showNewTag, setShowNewTag] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { tags, addTag } = useTags()

  const reset = () => {
    setKind(defaultKind ?? 'entrada'); setDescription(''); setAmount(''); setDate(defaultDate ?? today)
    setTagId('none'); setRecurrence('none'); setNewTagName(''); setShowNewTag(false)
  }

  useEffect(() => {
    if (open) {
      setKind(defaultKind ?? 'entrada')
      setDate(defaultDate ?? today)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate, defaultKind])

  const revalidateAll = () => mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/'), undefined, { revalidate: true })

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    const color = TAG_COLORS[tags.length % TAG_COLORS.length].key
    const tag = await addTag(newTagName.trim(), color)
    setTagId(tag.id)
    setNewTagName('')
    setShowNewTag(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          description: description || kindConfig[kind].singular,
          amount: Number(amount),
          date,
          tagId: tagId === 'none' ? null : tagId,
          recurrence,
        }),
      })
      if (!res.ok) throw new Error('Falha ao salvar')
      await revalidateAll()
      onOpenChange(false)
      reset()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTag = tags.find(t => t.id === tagId)

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="sm:max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">adicionar</DialogTitle>
          <DialogDescription className="sr-only">Adicionar um novo lançamento</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldRow icon={<Receipt className="w-4 h-4" />}>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-muted-foreground text-base">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="flex-1 bg-transparent outline-none text-lg font-semibold placeholder:text-muted-foreground placeholder:font-normal"
                required
                autoFocus
              />
            </div>
          </FieldRow>

          <OptionPopover
            options={kindOrder.map(k => ({
              value: k,
              label: kindConfig[k].singular,
              description: kindConfig[k].description,
              icon: <KindIcon kind={k} className="w-7 h-7 mt-0.5" />,
            }))}
            value={kind}
            onSelect={v => setKind(v as TransactionKind)}
            trigger={
              <FieldRow icon={<KindIcon kind={kind} className="w-4 h-4" />} interactive>
                <span className="flex-1 text-sm font-medium">{kindConfig[kind].singular}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </FieldRow>
            }
          />

          <FieldRow icon={<Pencil className="w-4 h-4" />}>
            <input
              placeholder={kindConfig[kind].singular}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </FieldRow>

          <Popover>
            <PopoverTrigger asChild>
              <FieldRow icon={<CalendarIcon className="w-4 h-4" />} interactive>
                <span className="flex-1 text-sm font-medium">{format(parseISO(date), 'dd/MM/yy', { locale: ptBR })}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </FieldRow>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={parseISO(date)}
                onSelect={d => d && setDate(format(d, 'yyyy-MM-dd'))}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <OptionPopover
            header="repetir"
            options={recurrenceOrder.map(r => ({ value: r, label: recurrenceConfig[r].label, description: recurrenceConfig[r].description }))}
            value={recurrence}
            onSelect={v => setRecurrence(v as Recurrence)}
            trigger={
              <FieldRow icon={<Repeat className="w-4 h-4" />} interactive>
                <span className="flex-1 text-sm font-medium">{recurrenceConfig[recurrence].label}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </FieldRow>
            }
          />

          <OptionPopover
            header="tags"
            options={[
              { value: 'none', label: 'sem tag' },
              ...tags.map(t => ({
                value: t.id,
                label: t.name,
                icon: <span className="w-2.5 h-2.5 rounded-full mt-1" style={{ background: TAG_COLORS.find(c => c.key === t.color)?.hex ?? '#c9cdd3' }} />,
              })),
            ]}
            value={tagId}
            onSelect={setTagId}
            footer={
              <div className="border-t border-border p-2">
                {showNewTag ? (
                  <div className="flex gap-1.5">
                    <input
                      autoFocus
                      placeholder="Nome da tag"
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      className="flex-1 min-w-0 text-sm px-2 py-1.5 rounded-md border border-input bg-transparent outline-none"
                    />
                    <Button type="button" size="sm" onClick={handleCreateTag}>Criar</Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewTag(true)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/60 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> nova tag
                  </button>
                )}
              </div>
            }
            trigger={
              <FieldRow icon={<TagIcon className="w-4 h-4" />} interactive className="border-b-0">
                <span className="flex-1 text-sm font-medium truncate">{selectedTag ? selectedTag.name : 'tags'}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </FieldRow>
            }
          />

          <Button
            type="submit"
            disabled={submitting}
            className={cn('w-full h-12 rounded-2xl text-base font-semibold mt-4 text-white hover:opacity-90', kindConfig[kind].bgClass)}
          >
            {submitting ? 'salvando...' : `adicionar ${kindConfig[kind].singular}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
