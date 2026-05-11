import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { Transaction, DayGroup } from '@/lib/types'

function mapRow(r: { id: string; description: string; amount: unknown; date: string; category: string | null; status: string; type: string; isRecurring: boolean; recurringEndDate?: string | null; creditCardId?: string | null; createdAt: Date; updatedAt: Date }): Transaction {
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
    creditCardId: r.creditCardId ?? null,
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

  const [rows, allRecurring, creditCards] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: session.id,
        date: { gte: `${year}-01-01`, lte: `${year}-12-31` },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.transaction.findMany({
      where: { userId: session.id, isRecurring: true },
    }),
    prisma.creditCard.findMany({
      where: { userId: session.id },
    }),
  ])

  const transactions: Transaction[] = rows.map(mapRow)

  // Mapeia quais meses já têm a transação recorrente gravada no banco
  const existingRecurringMonths = new Set<string>()
  for (const r of rows) {
    if (r.isRecurring) existingRecurringMonths.add(`${r.id}-${r.date.substring(5, 7)}`)
  }

  // Expande transações recorrentes
  const virtualTransactions: Transaction[] = []
  for (const rec of allRecurring) {
    const [recYear, recMonthStr, recDayStr] = rec.date.split('-')
    const recDay = parseInt(recDayStr)
    const startMonth = parseInt(recYear) < yearNum ? 1 : parseInt(recMonthStr)
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
        creditCardId: (rec as { creditCardId?: string | null }).creditCardId ?? null,
        created_at: rec.createdAt.toISOString(),
        updated_at: rec.updatedAt.toISOString(),
      })
    }
  }

  const allTransactions = [...transactions, ...virtualTransactions].sort((a, b) => a.date.localeCompare(b.date))

  // Marca despesas de cartão e gera pagamentos virtuais mensais
  const cardMap = new Map(creditCards.map(c => [c.id, c]))
  const markedTransactions: Transaction[] = allTransactions.map(t => {
    if (t.creditCardId && cardMap.has(t.creditCardId)) {
      return { ...t, isCardExpense: true }
    }
    return t
  })

  // Agrupa despesas de cartão por cartão+mês e cria pagamento virtual no mês seguinte
  const cardMonthTotals = new Map<string, number>() // "cardId|YYYY-MM" -> total
  for (const t of markedTransactions) {
    if (!t.isCardExpense || !t.creditCardId) continue
    const monthKey = `${t.creditCardId}|${t.date.substring(0, 7)}`
    cardMonthTotals.set(monthKey, (cardMonthTotals.get(monthKey) ?? 0) + t.amount)
  }

  const virtualCardPayments: Transaction[] = []
  for (const [key, total] of cardMonthTotals) {
    const [cardId, yearMonth] = key.split('|')
    const card = cardMap.get(cardId)
    if (!card || total === 0) continue

    // Pagamento no mês seguinte
    const [expYear, expMonthStr] = yearMonth.split('-')
    let payYear = parseInt(expYear)
    let payMonth = parseInt(expMonthStr) + 1
    if (payMonth > 12) { payMonth = 1; payYear++ }

    if (payYear.toString() !== year) continue // fora do ano visualizado

    const payMonthStr = String(payMonth).padStart(2, '0')
    const daysInPayMonth = new Date(payYear, payMonth, 0).getDate()
    const payDay = Math.min(card.paymentDay, daysInPayMonth)
    const payDate = `${payYear}-${payMonthStr}-${String(payDay).padStart(2, '0')}`

    const virtualId = `card-pay-${cardId}-${yearMonth}`
    // Verifica se já existe pagamento real com esse ID (evita duplicata)
    if (markedTransactions.some(t => t.id === virtualId)) continue

    virtualCardPayments.push({
      id: virtualId,
      description: `Fatura ${card.name}`,
      amount: total,
      date: payDate,
      category: 'Cartao',
      status: 'pendente',
      type: 'saida',
      isRecurring: false,
      creditCardId: cardId,
      isCardPayment: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  const finalTransactions = [...markedTransactions, ...virtualCardPayments].sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json(groupByDay(finalTransactions, yearNum))
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
      creditCardId: body.creditCardId ?? null,
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

    // Só confirmadas entram no saldo acumulado; despesas individuais de cartão também ficam de fora
    const confirmedTx = dayTx.filter(t => !t.isCardExpense && t.status === 'confirmado')
    const totalEntradas = confirmedTx.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0)
    const totalSaidas = confirmedTx.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0)
    accumulated += totalEntradas - totalSaidas
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
