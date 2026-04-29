import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createToken, setSessionCookie } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { name, email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { email, password: hashed, name: name || null } })

  const token = await createToken({ id: user.id, email: user.email, name: user.name })
  await setSessionCookie(token)

  return NextResponse.json({ ok: true }, { status: 201 })
}
