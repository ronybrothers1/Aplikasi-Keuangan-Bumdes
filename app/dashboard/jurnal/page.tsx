import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { DeleteJurnalButton } from './delete-jurnal-button'
import type { Coa, JournalItem } from '@/lib/types'

type JournalWithItems = {
  id: string
  number: string
  date: Date
  description: string
  items: (JournalItem & { coa: Coa })[]
}

export default async function JurnalPage() {
  const session = await getSession()
  if (!session) return null

  const journals: JournalWithItems[] = await db.journal.findMany({
    where: { tenantId: session.tenantId as string },
    include: {
      items: {
        include: { coa: true }
      }
    },
    orderBy: { date: 'desc' }
  })

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Jurnal Umum</h2>
          <p className="text-muted-foreground">Catatan transaksi keuangan BUMDes.</p>
        </div>
        <Link href="/dashboard/jurnal/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Jurnal
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi ({journals.length} entri)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. Bukti</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Akun</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Kredit</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Belum ada transaksi jurnal.
                  </TableCell>
                </TableRow>
              ) : (
                journals.map((journal) => (
                  <React.Fragment key={journal.id}>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-medium align-top" rowSpan={journal.items.length + 1}>
                        {format(new Date(journal.date), 'dd MMM yyyy', { locale: localeId })}
                      </TableCell>
                      <TableCell className="align-top" rowSpan={journal.items.length + 1}>
                        {journal.number}
                      </TableCell>
                      <TableCell className="align-top" rowSpan={journal.items.length + 1}>
                        {journal.description}
                      </TableCell>
                      <TableCell className="align-top text-center" rowSpan={journal.items.length + 1}>
                        <DeleteJurnalButton journalId={journal.id} />
                      </TableCell>
                    </TableRow>
                    {journal.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className={item.credit > 0 ? 'pl-8 text-muted-foreground' : ''}>
                          {item.coa.code} - {item.coa.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.debit > 0 ? formatRupiah(item.debit) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.credit > 0 ? formatRupiah(item.credit) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

import React from 'react'
