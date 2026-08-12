import { addDays, addMonths, differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { DayCell, HorizonteMonth, MonthTotais, Transaction } from './types'

const pad2 = (n: number) => String(n).padStart(2, '0')
const daysInMonth = (year: number, month1to12: number) => new Date(year, month1to12, 0).getDate()

/** Expande transações recorrentes (nenhuma/diária/semanal/mensal) dentro de um intervalo [rangeStart, rangeEnd] ('YYYY-MM-DD'). */
export function expandRecurringTransactions(rows: Transaction[], rangeStart: string, rangeEnd: string): Transaction[] {
  const result: Transaction[] = []
  const rangeStartDate = parseISO(rangeStart)
  const rangeEndDate = parseISO(rangeEnd)

  for (const row of rows) {
    if (row.date >= rangeStart && row.date <= rangeEnd) result.push(row)
    if (!row.recurrence || row.recurrence === 'none') continue

    if (row.recurrence === 'monthly') {
      const originYear = parseInt(row.date.slice(0, 4))
      const originMonth = parseInt(row.date.slice(5, 7))
      const day = parseInt(row.date.slice(8, 10))
      const rangeEndMonth = rangeEnd.slice(0, 7)

      let cursorYear = originYear
      let cursorMonth = originMonth + 1
      while (true) {
        if (cursorMonth > 12) { cursorMonth = 1; cursorYear++ }
        const monthStr = `${cursorYear}-${pad2(cursorMonth)}`
        if (monthStr > rangeEndMonth) break

        const clampedDay = Math.min(day, daysInMonth(cursorYear, cursorMonth))
        const date = `${monthStr}-${pad2(clampedDay)}`
        if (date >= rangeStart && date <= rangeEnd) {
          result.push({ ...row, id: `${row.id}-v${monthStr}`, date, isVirtual: true })
        }
        cursorMonth++
      }
      continue
    }

    // daily / weekly: passo fixo de dias a partir da data original
    const stepDays = row.recurrence === 'daily' ? 1 : 7
    const origin = parseISO(row.date)
    let cursor: Date
    if (origin < rangeStartDate) {
      const diffDays = differenceInCalendarDays(rangeStartDate, origin)
      const steps = Math.ceil(diffDays / stepDays)
      cursor = addDays(origin, steps * stepDays)
    } else {
      cursor = addDays(origin, stepDays)
    }

    while (cursor <= rangeEndDate) {
      const date = format(cursor, 'yyyy-MM-dd')
      if (date >= rangeStart) result.push({ ...row, id: `${row.id}-v${date}`, date, isVirtual: true })
      cursor = addDays(cursor, stepDays)
    }
  }

  return result
}

/** Taxa diária fixa "atual": valor do lançamento kind=diario + recurrence=daily mais recente com data <= hoje. */
export function currentDailyDiarioRate(rows: Transaction[], todayStr: string): number {
  const candidates = rows.filter(r => r.kind === 'diario' && r.recurrence === 'daily' && r.date <= todayStr)
  if (candidates.length === 0) return 0
  candidates.sort((a, b) => b.date.localeCompare(a.date))
  return candidates[0].amount
}

function emptyCell(date: string): DayCell {
  return { date, entradas: 0, saidas: 0, diarios: 0, economias: 0, cartao: 0, dailyBalance: 0, accumulatedBalance: 0, transactions: [], allConfirmed: false }
}

/**
 * Monta as células diárias de [rangeStart, rangeEnd] a partir das transações já expandidas
 * (recorrentes incluídas). `initialBalance` é o saldo acumulado de tudo que veio antes de rangeStart.
 */
export function buildDayCells(
  transactions: Transaction[],
  rangeStart: string,
  rangeEnd: string,
  initialBalance = 0,
): DayCell[] {
  const byDate = new Map<string, Transaction[]>()
  for (const t of transactions) {
    if (!byDate.has(t.date)) byDate.set(t.date, [])
    byDate.get(t.date)!.push(t)
  }

  const cells: DayCell[] = []
  let cursor = parseISO(rangeStart)
  const end = parseISO(rangeEnd)
  let accumulated = initialBalance

  while (cursor <= end) {
    const date = format(cursor, 'yyyy-MM-dd')
    const cell = emptyCell(date)
    const dayTx = byDate.get(date) ?? []

    for (const t of dayTx) {
      cell.transactions.push(t)
      if (t.kind === 'entrada') cell.entradas += t.amount
      else if (t.kind === 'saida') cell.saidas += t.amount
      else if (t.kind === 'diario') cell.diarios += t.amount
      else if (t.kind === 'economia') cell.economias += t.amount
      else if (t.kind === 'cartao') cell.cartao += t.amount
    }

    cell.dailyBalance = cell.entradas - cell.saidas - cell.diarios - cell.economias - cell.cartao
    accumulated += cell.dailyBalance
    cell.accumulatedBalance = accumulated
    // Só linhas reais (não ocorrências virtuais de recorrência) contam para "confirmado":
    // uma ocorrência virtual herda o status da linha-base, que não representa aquele dia específico.
    const realDayTx = dayTx.filter(t => !t.isVirtual)
    cell.allConfirmed = realDayTx.length > 0 && realDayTx.every(t => t.status === 'confirmado')

    cells.push(cell)
    cursor = addDays(cursor, 1)
  }

  return cells
}

/** Calcula os indicadores da tela "totais" para um mês, conforme as fórmulas observadas no app original. */
export function computeMonthTotais(month: string, monthCells: DayCell[], diarioFixoAtual: number, todayStr: string): MonthTotais {
  const [y, m] = month.split('-').map(Number)
  const diasNoMes = daysInMonth(y, m)
  const isPastMonth = month < todayStr.slice(0, 7)
  const isFutureMonth = month > todayStr.slice(0, 7)
  const diaAtual = isPastMonth ? diasNoMes : isFutureMonth ? 0 : parseInt(todayStr.slice(8, 10))

  const realizadas = monthCells.filter(c => c.date <= todayStr)
  const entradas = realizadas.reduce((s, c) => s + c.entradas, 0)
  const saidas = realizadas.reduce((s, c) => s + c.saidas, 0)
  const diarios = realizadas.reduce((s, c) => s + c.diarios, 0)
  const economias = realizadas.reduce((s, c) => s + c.economias, 0)
  const cartao = realizadas.reduce((s, c) => s + c.cartao, 0)

  const restDays = Math.max(0, diasNoMes - diaAtual)
  const diarioProjetadoRestoMes = diarioFixoAtual * restDays

  return {
    month,
    entradas,
    saidas,
    diarios,
    economias,
    cartao,
    diarioProjetadoRestoMes,
    diarioFixoAtual,
    performance: entradas - saidas - diarios - economias - cartao - diarioProjetadoRestoMes,
    custoDeVida: saidas + diarios + cartao + diarioProjetadoRestoMes,
    diarioMedio: diaAtual > 0 ? diarios / diaAtual : 0,
    economizadoPct: entradas > 0 ? (economias / entradas) * 100 : 0,
    diaAtual,
    diasNoMes,
  }
}

/** Monta a grade de meses para o heatmap "horizonte", a partir das células diárias já calculadas. */
export function buildHorizonteMonths(cells: DayCell[], startMonth: string, count: number): HorizonteMonth[] {
  const byMonth = new Map<string, DayCell[]>()
  for (const c of cells) {
    const month = c.date.slice(0, 7)
    if (!byMonth.has(month)) byMonth.set(month, [])
    byMonth.get(month)!.push(c)
  }

  const result: HorizonteMonth[] = []
  const [y, m] = startMonth.split('-').map(Number)
  let cursor = new Date(y, m - 1, 1)

  for (let i = 0; i < count; i++) {
    const month = format(cursor, 'yyyy-MM')
    const monthCells = byMonth.get(month) ?? []
    result.push({
      month,
      label: format(cursor, 'MMM/yy'),
      days: monthCells.map(c => ({ day: parseInt(c.date.slice(8, 10)), date: c.date, saldo: c.accumulatedBalance })),
    })
    cursor = addMonths(cursor, 1)
  }

  return result
}
