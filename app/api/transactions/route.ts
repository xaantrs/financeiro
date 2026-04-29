import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { Transaction, DayGroup } from '@/lib/types'

function mapRow(r: { id: string; description: string; amount: unknown; date: string; category: string | null; status: string; type: string; isRecurring: boolean; recurringEndDate?: string | null; paymentMethod?: string; createdAt: Date; updatedAt: Date }): Transaction {
  return {
    id: r.id,
    description: r.description,
    amount: Number(r.amount),
    date: r.date,
    category: r.category,
    status: r.status as 'pendente' | 'confirmado',
    type: r.type as 'entrada' | 'saida',
    isRecurring: r.isRecurring,
    recurringEndDate: r.recurringEndDate ?? null,
    paymentMethod: (r.paymentMethod ?? 'dinheiro') as 'dinheiro' | 'cartao_credito',
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') ?? new Date().getFullYear().toString()
  const yearNum = parseInt(year)

  // Busca transações do ano
  const rows = await prisma.transaction.findMany({
    where: {
      userId: session.id,
      date: { gte: `${year}-01-01`, lte: `${year}-12-31` },
    },
    orderBy: { date: 'asc' },
  })

  // Busca todas as transações recorrentes (de qualquer data) para expandir no ano
  const allRecurring = await prisma.transaction.findMany({
    where: { userId: session.id, isRecurring: true },
  })

  const transactions: Transaction[] = rows.map(mapRow)

  // Mapeia quais meses já têm a transação recorrente gravada no banco
  const existingRecurringMonths = new Set<string>()
  for (const r of rows) {
    if (r.isRecurring) existingRecurringMonths.add(`${r.id}-${r.date.substring(5, 7)}`)
  }

  // Expande cada transação recorrente do mês de criação até dezembro do ano requisitado
  const virtualTransactions: Transaction[] = []
  for (const rec of allRecurring) {
    const [recYear, recMonthStr, recDayStr] = rec.date.split('-')
    const recDay = parseInt(recDayStr)
    const startMonth = parseInt(recYear) < yearNum ? 1 : parseInt(recMonthStr)
    // Mês de término: respeita recurringEndDate se estiver no mesmo ano
    const endDate = (rec as { recurringEndDate?: string | null }).recurringEndDate
    const endMonth = endDate && endDate.startsWith(year) ? parseInt(endDate.split('-')[1]) : 12
    for (let month = startMonth; month <= endMonth; month++) {
      const monthStr = String(month).padStart(2, '0')
      if (existingRecurringMonths.has(`${rec.id}-${monthStr}`)) continue
      const daysInMonth = new Date(yearNum, month, 0).getDate()
      const day = Math.min(recDay, daysInMonth)
      const expandedDate = `${year}-${monthStr}-${String(day).padStart(2, '0')}`
      virtualTransactions.push({
        id: `${rec.id}-v${month}`,
        description: rec.description,
        amount: Number(rec.amount),
        date: expandedDate,
        category: rec.category,
        status: rec.status as 'pendente' | 'confirmado',
        type: rec.type as 'entrada' | 'saida',
        isRecurring: true,
        created_at: rec.createdAt.toISOString(),
        updated_at: rec.updatedAt.toISOString(),
      })
    }
  }

  const allTransactions = [...transactions, ...virtualTransactions].sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json(groupByDay(allTransactions, yearNum))
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  const row = await prisma.transaction.create({
    data: {
      description: body.description,
      amount: body.amount,
      date: body.date,
      category: body.category || null,
      status: body.status || 'pendente',
      type: body.type,
      isRecurring: body.isRecurring ?? false,
      recurringEndDate: body.recurringEndDate ?? null,
      paymentMethod: body.paymentMethod ?? 'dinheiro',
      userId: session.id,
    },
  })

  return NextResponse.json(row, { status: 201 })
}

function groupByDay(transactions: Transaction[], year: number, initialBalance = 0): DayGroup[] {
  const byDate = new Map<string, Transaction[]>()
  for (const t of transactions) {
    if (!byDate.has(t.date)) byDate.set(t.date, [])
    byDate.get(t.date)!.push(t)
  }

  // Gera todos os 365/366 dias do ano
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const daysInYear = isLeap ? 366 : 365
  const startDate = new Date(year, 0, 1)

  let accumulated = initialBalance
  const result: DayGroup[] = []

  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const dayTx = byDate.get(dateStr) || []
    const totalEntradas = dayTx.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0)
    const totalSaidas = dayTx.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0)
    // Cartão de crédito não afeta o saldo em dinheiro
    const cashEntradas = dayTx.filter(t => t.type === 'entrada' && t.paymentMethod !== 'cartao_credito').reduce((s, t) => s + Number(t.amount), 0)
    const cashSaidas = dayTx.filter(t => t.type === 'saida' && t.paymentMethod !== 'cartao_credito').reduce((s, t) => s + Number(t.amount), 0)
    accumulated += cashEntradas - cashSaidas
    result.push({
      date: dateStr,
      transactions: dayTx,
      totalEntradas,
      totalSaidas,
      dailyBalance: totalEntradas - totalSaidas,
      accumulatedBalance: accumulated,
    })
  }

  return result
}
