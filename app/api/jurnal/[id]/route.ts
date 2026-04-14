import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const journal = await db.journal.findFirst({
      where: { id, tenantId: session.tenantId as string }
    })

    if (!journal) {
      return NextResponse.json({ error: 'Jurnal tidak ditemukan' }, { status: 404 })
    }

    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.journal.delete({ where: { id } })
      await tx.auditTrail.create({
        data: {
          action: 'DELETE',
          tableName: 'Journal',
          recordId: id,
          oldData: JSON.stringify(journal),
          userId: session.userId as string,
          tenantId: session.tenantId as string
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting journal:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
