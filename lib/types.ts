export type TransactionKind = 'entrada' | 'saida' | 'diario' | 'economia' | 'cartao'
export type TransactionStatus = 'pendente' | 'confirmado'
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface Transaction {
  id: string
  kind: TransactionKind
  description: string
  amount: number
  date: string // 'YYYY-MM-DD'
  status: TransactionStatus
  recurrence: Recurrence
  tagId?: string | null
  tag?: Tag | null
  isVirtual?: boolean // ocorrência gerada por recorrência, não é uma linha real no banco
  createdAt: string
  updatedAt: string
}

export interface TransactionFormData {
  kind: TransactionKind
  description: string
  amount: number
  date: string
  status?: TransactionStatus
  recurrence?: Recurrence
  tagId?: string | null
}

export interface DayCell {
  date: string // 'YYYY-MM-DD'
  entradas: number
  saidas: number
  diarios: number
  economias: number
  cartao: number
  dailyBalance: number
  accumulatedBalance: number
  transactions: Transaction[]
  allConfirmed: boolean
}

export interface MonthTotais {
  month: string // 'YYYY-MM'
  entradas: number
  saidas: number
  diarios: number
  economias: number
  cartao: number
  diarioProjetadoRestoMes: number
  diarioFixoAtual: number
  performance: number
  custoDeVida: number
  diarioMedio: number
  economizadoPct: number
  diaAtual: number
  diasNoMes: number
}

export interface HorizonteMonth {
  month: string // 'YYYY-MM'
  label: string
  days: { day: number; date: string; saldo: number | null }[]
}
