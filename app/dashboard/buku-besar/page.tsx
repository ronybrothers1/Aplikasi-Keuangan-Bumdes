import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

export default async function BukuBesarPage({
  searchParams
}: {
  searchParams: Promise<{ coaId?: string }>
}) {
  const session = await getSession()
  if (!session) return null

  const params = await searchParams
  const selectedCoaId = params.coaId

  const coas = await db.coa.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { code: 'asc' }
  })

  let journalItems: any[] = []
  let selectedCoa: any = null

  if (selectedCoaId) {
    selectedCoa = coas.find(c => c.id === selectedCoaId)
    journalItems = await db.journalItem.findMany({
      where: {
        coaId: selectedCoaId,
        journal: {
          tenantId: session.tenantId
        }
      },
      include: {
        journal: true
      },
      orderBy: {
        journal: {
          date: 'asc'
        }
      }
    })
  }

  let runningBalance = 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Buku Besar</h2>
        <p className="text-muted-foreground">
          Rincian transaksi per akun perkiraan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-4 items-end">
            <div className="space-y-2 flex-1 max-w-md">
              <label htmlFor="coaId" className="text-sm font-medium">Pilih Akun</label>
              <select 
                name="coaId" 
                id="coaId"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={selectedCoaId || ''}
              >
                <option value="" disabled>-- Pilih Akun --</option>
                {coas.map(coa => (
                  <option key={coa.id} value={coa.id}>
                    {coa.code} - {coa.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
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
                {journalItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Belum ada transaksi untuk akun ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  journalItems.map((item) => {
                    if (selectedCoa.normalBalance === 'DEBIT') {
                      runningBalance += item.debit - item.credit
                    } else {
                      runningBalance += item.credit - item.debit
                    }

                    return (
                      <TableRow key={item.id}>
                        <TableCell>{format(new Date(item.journal.date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>{item.journal.number}</TableCell>
                        <TableCell>{item.journal.description}</TableCell>
                        <TableCell className="text-right">
                          {item.debit > 0 ? new Intl.NumberFormat('id-ID').format(item.debit) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.credit > 0 ? new Intl.NumberFormat('id-ID').format(item.credit) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {new Intl.NumberFormat('id-ID').format(runningBalance)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
