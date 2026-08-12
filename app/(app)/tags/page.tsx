'use client'

import { useState } from 'react'
import { format, startOfMonth } from 'date-fns'
import { Search, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useTags, type TagWithTotal } from '@/hooks/use-tags'
import { MonthNav } from '@/components/finance/month-nav'
import { TagEditDialog } from '@/components/finance/tag-edit-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { fmtCurrency, tagColorHex } from '@/lib/utils'

export default function TagsPage() {
  const [month, setMonth] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM'))
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<TagWithTotal | null | undefined>(undefined) // undefined = fechado, null = criar
  const [deleting, setDeleting] = useState<TagWithTotal | null>(null)

  const { tags, isLoading, addTag, updateTag, deleteTag } = useTags(month)
  const filtered = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-4 md:px-6 py-3 border-b border-border grid grid-cols-3 items-center">
        <h1 className="text-base md:text-lg font-semibold">tags</h1>
        <div className="col-span-2 md:col-span-1 justify-self-end md:justify-self-center">
          <MonthNav month={month} onChange={setMonth} />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="filtrar tags" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button size="icon" variant="outline" onClick={() => setEditing(null)} title="Nova tag">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="rounded-2xl border border-border divide-y divide-border">
            {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}
            {!isLoading && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tag encontrada</p>
            )}
            {filtered.map(tag => (
              <div key={tag.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: tagColorHex(tag.color) }} />
                <span className="flex-1 text-sm font-medium truncate">{tag.name}</span>
                <span className="text-sm font-semibold tabular-nums">{fmtCurrency(tag.total, 2)}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing(tag)}>
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleting(tag)}>
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TagEditDialog
        tag={editing ?? null}
        open={editing !== undefined}
        onOpenChange={v => { if (!v) setEditing(undefined) }}
        onSave={async data => {
          if (editing) await updateTag(editing.id, data)
          else await addTag(data.name, data.color)
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={v => { if (!v) setDeleting(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tag &quot;{deleting?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Os lançamentos com essa tag continuam existindo, apenas perdem a marcação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleting) deleteTag(deleting.id); setDeleting(null) }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
