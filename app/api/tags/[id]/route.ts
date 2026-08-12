import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const existing = await prisma.tag.findFirst({ where: { id, userId: session.id } })
  if (!existing) return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 })

  const tag = await prisma.tag.update({
    where: { id },
    data: { name: body.name ?? existing.name, color: body.color ?? existing.color },
  })

  return NextResponse.json(tag)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.tag.findFirst({ where: { id, userId: session.id } })
  if (!existing) return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 })

  await prisma.tag.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
