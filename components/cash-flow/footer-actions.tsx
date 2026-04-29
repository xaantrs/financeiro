'use client'

import { Plus, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface FooterActionsProps {
  onAddClick: () => void
}

export function FooterActions({ onAddClick }: FooterActionsProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-area-inset-bottom">
      <div className="flex gap-3 max-w-lg mx-auto">
        <Button 
          onClick={onAddClick}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Lancamento
        </Button>
        
        <Button 
          variant="outline" 
          className="flex-1"
          asChild
        >
          <Link href="/extrato">
            <List className="w-4 h-4 mr-2" />
            Ver Extrato
          </Link>
        </Button>
      </div>
    </footer>
  )
}
