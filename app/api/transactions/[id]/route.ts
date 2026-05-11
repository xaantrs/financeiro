import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.transaction.deleteMany({ where: { id, userId: session.id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  await prisma.transaction.updateMany({
    where: { id, userId: session.id },
    data: {
      ...(body.description !== undefined && { description: body.description }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.date !== undefined && { date: body.date }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.isRecurring !== undefined && { isRecurring: body.isRecurring }),
      ...(body.recurringEndDate !== undefined && { recurringEndDate: body.recurringEndDate }),
      ...(body.creditCardId !== undefined && { creditCardId: body.creditCardId }),
    },
  })

  return NextResponse.json({ success: true })
}
