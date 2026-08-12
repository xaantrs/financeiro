'use client'

import useSWR from 'swr'
import type { Tag } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export interface TagWithTotal extends Tag {
  total: number
}

export function useTags(month?: string) {
  const url = month ? `/api/tags?month=${month}` : '/api/tags'
  const { data, isLoading, mutate } = useSWR<TagWithTotal[]>(url, fetcher)

  const addTag = async (name: string, color: string) => {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
    if (!res.ok) throw new Error('Falha ao criar tag')
    mutate()
    return res.json()
  }

  const updateTag = async (id: string, updates: { name?: string; color?: string }) => {
    const res = await fetch(`/api/tags/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Falha ao atualizar tag')
    mutate()
  }

  const deleteTag = async (id: string) => {
    const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Falha ao excluir tag')
    mutate()
  }

  return { tags: data ?? [], isLoading, addTag, updateTag, deleteTag, refresh: mutate }
}
