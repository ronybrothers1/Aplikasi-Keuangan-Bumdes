import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

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

    // Validate balance
    const totalDebit = items.reduce((sum: number, item: any) => sum + item.debit, 0)
    const totalCredit = items.reduce((sum: number, item: any) => sum + item.credit, 0)

    if (totalDebit !== totalCredit || totalDebit <= 0) {
      return NextResponse.json({ error: 'Jurnal tidak balance' }, { status: 400 })
    }

    // Generate Journal Number (e.g., JU-202310-0001)
    const dateObj = new Date(date)
    const yearMonth = `${dateObj.getFullYear()}${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`
    
    const lastJournal = await db.journal.findFirst({
      where: {
        tenantId: session.tenantId,
        number: { startsWith: `JU-${yearMonth}` }
      },
      orderBy: { number: 'desc' }
    })

    let sequence = 1
    if (lastJournal) {
      const lastSeq = parseInt(lastJournal.number.split('-')[2])
      sequence = lastSeq + 1
    }

    const journalNumber = `JU-${yearMonth}-${sequence.toString().padStart(4, '0')}`

    // Create Journal and Items in a transaction
    const journal = await db.$transaction(async (tx) => {
      const newJournal = await tx.journal.create({
        data: {
          number: journalNumber,
          date: new Date(date),
          description,
          tenantId: session.tenantId,
          createdBy: session.userId,
          items: {
            create: items.map((item: any) => ({
              coaId: item.coaId,
              debit: item.debit,
              credit: item.credit
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
          newData: JSON.stringify(newJournal),
          userId: session.userId,
          tenantId: session.tenantId
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
