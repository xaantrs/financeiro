'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TAG_COLORS, cn } from '@/lib/utils'
import type { Tag } from '@/lib/types'

interface TagEditDialogProps {
  tag: Tag | null // null = criar nova
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { name: string; color: string }) => Promise<void>
}

export function TagEditDialog({ tag, open, onOpenChange, onSave }: TagEditDialogProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(TAG_COLORS[0].key)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(tag?.name ?? '')
      setColor(tag?.color ?? TAG_COLORS[0].key)
    }
  }, [open, tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await onSave({ name: name.trim(), color })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{tag ? 'Editar tag' : 'Nova tag'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="tag-name">Nome</Label>
            <Input id="tag-name" value={name} onChange={e => setName(e.target.value)} autoFocus required />
          </div>
          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={cn('w-7 h-7 rounded-full border-2 transition-transform', color === c.key ? 'border-foreground scale-110' : 'border-transparent')}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
