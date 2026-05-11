export interface CreditCard {
  id: string
  name: string
  paymentDay: number
  createdAt: string
}

export interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  category: string | null
  status: 'pendente' | 'confirmado'
  type: 'entrada' | 'saida'
  isRecurring: boolean
  recurringEndDate?: string | null
  creditCardId?: string | null
  isCardExpense?: boolean   // despesa do cartão (excluída do saldo direto)
  isCardPayment?: boolean   // pagamento virtual agrupado do cartão
  created_at: string
  updated_at: string
}

export interface DayGroup {
  date: string
  transactions: Transaction[]
  totalEntradas: number
  totalSaidas: number
  dailyBalance: number
  accumulatedBalance: number
}

export interface TransactionFormData {
  description: string
  amount: number
  date: string
  category: string
  status: 'pendente' | 'confirmado'
  type: 'entrada' | 'saida'
  isRecurring?: boolean
  recurringEndDate?: string | null
  creditCardId?: string | null
}

export interface MonthForecast {
  month: string       // "YYYY-MM"
  label: string       // "Jan/2025"
  entradas: number
  saidas: number
  saldo: number
  acumulado: number
  isProjection: boolean
}
