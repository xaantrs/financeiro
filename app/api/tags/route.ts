import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // 'YYYY-MM' opcional, para somar totais do mês

  const tags = await prisma.tag.findMany({
    where: { userId: session.id },
    orderBy: { name: 'asc' },
  })

  if (!month) {
    return NextResponse.json(tags.map(t => ({ ...t, createdAt: t.createdAt.toISOString(), total: 0 })))
  }

  const start = `${month}-01`
  const [y, m] = month.split('-').map(Number)
  const end = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.id, date: { gte: start, lte: end }, tagId: { not: null } },
  })

  const totals = new Map<string, number>()
  for (const t of transactions) {
    totals.set(t.tagId!, (totals.get(t.tagId!) ?? 0) + Number(t.amount))
  }

  return NextResponse.json(
    tags.map(t => ({ ...t, createdAt: t.createdAt.toISOString(), total: totals.get(t.id) ?? 0 })),
  )
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  if (!body.name || !body.color) {
    return NextResponse.json({ error: 'Nome e cor são obrigatórios' }, { status: 400 })
  }

  const tag = await prisma.tag.create({
    data: { name: body.name, color: body.color, userId: session.id },
  })

  return NextResponse.json(tag, { status: 201 })
}
