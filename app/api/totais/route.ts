import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { format } from 'date-fns'
import { buildDayCells, computeMonthTotais, currentDailyDiarioRate, expandRecurringTransactions } from '@/lib/finance'
import type { Transaction } from '@/lib/types'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') ?? format(new Date(), 'yyyy-MM')
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const [y, m] = month.split('-').map(Number)
  const start = `${month}-01`
  const end = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`

  const rows = await prisma.transaction.findMany({ where: { userId: session.id }, include: { tag: true }, orderBy: { date: 'asc' } })

  const transactions: Transaction[] = rows.map(r => ({
    id: r.id,
    kind: r.kind as Transaction['kind'],
    description: r.description,
    amount: Number(r.amount),
    date: r.date,
    status: r.status as Transaction['status'],
    recurrence: r.recurrence as Transaction['recurrence'],
    tagId: r.tagId,
    tag: r.tag ? { id: r.tag.id, name: r.tag.name, color: r.tag.color, createdAt: r.tag.createdAt.toISOString() } : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  const expanded = expandRecurringTransactions(transactions, start, end)
  const cells = buildDayCells(expanded, start, end)

  const diarioFixoAtual = currentDailyDiarioRate(transactions, todayStr)
  const totais = computeMonthTotais(month, cells, diarioFixoAtual, todayStr)

  const movimentacoes = cells
    .filter(c => c.date <= todayStr)
    .flatMap(c => c.transactions)
    .sort((a, b) => b.date.localeCompare(a.date))

  return NextResponse.json({ totais, movimentacoes })
}
