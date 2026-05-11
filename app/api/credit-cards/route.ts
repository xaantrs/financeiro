import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cards = await prisma.creditCard.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(cards.map(c => ({
    id: c.id,
    name: c.name,
    paymentDay: c.paymentDay,
    createdAt: c.createdAt.toISOString(),
  })))
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  if (!body.name || !body.paymentDay) {
    return NextResponse.json({ error: 'Nome e dia de pagamento são obrigatórios' }, { status: 400 })
  }

  const card = await prisma.creditCard.create({
    data: {
      name: body.name,
      paymentDay: Number(body.paymentDay),
      userId: session.id,
    },
  })

  return NextResponse.json({ id: card.id, name: card.name, paymentDay: card.paymentDay, createdAt: card.createdAt.toISOString() }, { status: 201 })
}
