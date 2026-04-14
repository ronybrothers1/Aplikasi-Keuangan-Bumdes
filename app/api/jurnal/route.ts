export const runtime = 'nodejs'

import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const journals = await db.journal.findMany({
      where: { tenantId: session.tenantId as string },
      include: {
        items: {
          include: { coa: true }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ journals })
  } catch (error) {
    console.error('Error fetching journals:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, description, items } = body

    if (!date || !description || !items || items.length < 2) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    // Validate all items have a coaId
    const hasEmptyCoa = items.some((item: { coaId: string }) => !item.coaId)
    if (hasEmptyCoa) {
      return NextResponse.json({ error: 'Semua baris jurnal harus memiliki akun' }, { status: 400 })
    }

    // Validate balance — use fixed-point arithmetic to avoid floating-point drift
    const totalDebit = Math.round(items.reduce((sum: number, item: { debit: number }) => sum + (Number(item.debit) || 0), 0) * 100)
    const totalCredit = Math.round(items.reduce((sum: number, item: { credit: number }) => sum + (Number(item.credit) || 0), 0) * 100)

    if (totalDebit !== totalCredit || totalDebit <= 0) {
      return NextResponse.json({ error: 'Jurnal tidak balance (Total Debit harus sama dengan Total Kredit dan lebih dari 0)' }, { status: 400 })
    }

    // Generate Journal Number (e.g., JU-202310-0001)
    const dateObj = new Date(date)
    const yearMonth = `${dateObj.getFullYear()}${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`

    const lastJournal = await db.journal.findFirst({
      where: {
        tenantId: session.tenantId as string,
        number: { startsWith: `JU-${yearMonth}` }
      },
      orderBy: { number: 'desc' }
    })

    let sequence = 1
    if (lastJournal) {
      const parts = lastJournal.number.split('-')
      const lastSeq = parseInt(parts[2] ?? '0', 10)
      if (!isNaN(lastSeq)) sequence = lastSeq + 1
    }

    const journalNumber = `JU-${yearMonth}-${sequence.toString().padStart(4, '0')}`

    // Create Journal and Items in a transaction
    const journal = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const newJournal = await tx.journal.create({
        data: {
          number: journalNumber,
          date: new Date(date),
          description,
          tenantId: session.tenantId as string,
          createdBy: session.userId as string,
          items: {
            create: items.map((item: { coaId: string; debit: number; credit: number }) => ({
              coaId: item.coaId,
              debit: Number(item.debit) || 0,
              credit: Number(item.credit) || 0
            }))
          }
        }
      })

      // Create Audit Trail
      await tx.auditTrail.create({
        data: {
          action: 'CREATE',
          tableName: 'Journal',
          recordId: newJournal.id,
          newData: JSON.stringify({ number: newJournal.number, date: newJournal.date, description }),
          userId: session.userId as string,
          tenantId: session.tenantId as string
        }
      })

      return newJournal
    })

    return NextResponse.json({ success: true, journal })
  } catch (error) {
    console.error('Error creating journal:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
