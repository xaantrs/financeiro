import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { format, addMonths, startOfMonth } from 'date-fns'
import { buildDayCells, buildHorizonteMonths, expandRecurringTransactions } from '@/lib/finance'
import type { Transaction } from '@/lib/types'

const MONTHS_AHEAD = 12

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const now = new Date()
  const startMonth = format(startOfMonth(now), 'yyyy-MM')
  const endMonth = format(addMonths(startOfMonth(now), MONTHS_AHEAD - 1), 'yyyy-MM')
  const [ey, em] = endMonth.split('-').map(Number)
  const rangeEnd = `${endMonth}-${String(new Date(ey, em, 0).getDate()).padStart(2, '0')}`

  const rows = await prisma.transaction.findMany({ where: { userId: session.id }, orderBy: { date: 'asc' } })

  const transactions: Transaction[] = rows.map(r => ({
    id: r.id,
    kind: r.kind as Transaction['kind'],
    description: r.description,
    amount: Number(r.amount),
    date: r.date,
    status: r.status as Transaction['status'],
    recurrence: r.recurrence as Transaction['recurrence'],
    tagId: r.tagId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  const earliest = transactions.length > 0 ? transactions.reduce((min, t) => (t.date < min ? t.date : min), transactions[0].date) : startMonth + '-01'
  const spanStart = earliest < startMonth ? earliest : `${startMonth}-01`

  const expanded = expandRecurringTransactions(transactions, spanStart, rangeEnd)
  const cells = buildDayCells(expanded, spanStart, rangeEnd)

  const months = buildHorizonteMonths(cells, startMonth, MONTHS_AHEAD)

  return NextResponse.json({ months, today: format(now, 'yyyy-MM-dd') })
}
