import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { Coa, Journal, JournalItem } from '@/lib/types'

type JournalItemWithJournal = JournalItem & { journal: Journal }

export default async function BukuBesarPage({
  searchParams
}: {
  searchParams: Promise<{ coaId?: string }>
}) {
  const session = await getSession()
  if (!session) return null

  const params = await searchParams
  const selectedCoaId = params.coaId

  const coas: Coa[] = await db.coa.findMany({
    where: { tenantId: session.tenantId as string },
    orderBy: { code: 'asc' }
  })

  let journalItems: JournalItemWithJournal[] = []
  let selectedCoa: Coa | undefined = undefined

  if (selectedCoaId) {
    selectedCoa = coas.find((c: Coa) => c.id === selectedCoaId)
    journalItems = await db.journalItem.findMany({
      where: {
        coaId: selectedCoaId,
        journal: { tenantId: session.tenantId as string }
      },
      include: { journal: true },
      orderBy: { journal: { date: 'asc' } }
    })
  }

  const formatRupiah = (v: number) =>
    new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(v)

  let runningBalance = 0

  const totalDebit = journalItems.reduce((s: number, i: JournalItemWithJournal) => s + i.debit, 0)
  const totalCredit = journalItems.reduce((s: number, i: JournalItemWithJournal) => s + i.credit, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Buku Besar</h2>
        <p className="text-muted-foreground">Rincian transaksi per akun perkiraan.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Filter Akun</CardTitle></CardHeader>
        <CardContent>
          <form className="flex gap-4 items-end">
            <div className="space-y-2 flex-1 max-w-md">
              <label htmlFor="coaId" className="text-sm font-medium">Pilih Akun</label>
              <select
                name="coaId"
                id="coaId"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                defaultValue={selectedCoaId ?? ''}
              >
                <option value="" disabled>-- Pilih Akun --</option>
                {coas.map((coa: Coa) => (
                  <option key={coa.id} value={coa.id}>
                    {coa.code} - {coa.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Tampilkan
            </button>
          </form>
        </CardContent>
      </Card>

      {selectedCoa && (
        <Card>
          <CardHeader>
            <CardTitle>
              Buku Besar: {selectedCoa.code} - {selectedCoa.name}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (Saldo Normal: {selectedCoa.normalBalance})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. Bukti</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/30 text-xs text-muted-foreground">
                  <TableCell colSpan={5} className="font-medium">Saldo Awal</TableCell>
                  <TableCell className="text-right font-medium">0</TableCell>
                </TableRow>
                {journalItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Belum ada transaksi untuk akun ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  journalItems.map((item: JournalItemWithJournal) => {
                    if (selectedCoa!.normalBalance === 'DEBIT') {
                      runningBalance += item.debit - item.credit
                    } else {
                      runningBalance += item.credit - item.debit
                    }
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{format(new Date(item.journal.date), 'dd MMM yyyy', { locale: localeId })}</TableCell>
                        <TableCell>{item.journal.number}</TableCell>
                        <TableCell>{item.journal.description}</TableCell>
                        <TableCell className="text-right">
                          {item.debit > 0 ? formatRupiah(item.debit) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.credit > 0 ? formatRupiah(item.credit) : '-'}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${runningBalance < 0 ? 'text-red-600' : ''}`}>
                          {formatRupiah(Math.abs(runningBalance))}{runningBalance < 0 ? ' (K)' : ''}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
                {journalItems.length > 0 && (
                  <TableRow className="bg-muted/50 font-bold border-t-2">
                    <TableCell colSpan={3} className="text-right">Total:</TableCell>
                    <TableCell className="text-right">{formatRupiah(totalDebit)}</TableCell>
                    <TableCell className="text-right">{formatRupiah(totalCredit)}</TableCell>
                    <TableCell className={`text-right ${runningBalance < 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {formatRupiah(Math.abs(runningBalance))}{runningBalance < 0 ? ' (K)' : ' (D)'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
