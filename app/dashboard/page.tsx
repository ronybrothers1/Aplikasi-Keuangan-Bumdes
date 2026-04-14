import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { calcCoaBalance, formatRupiah, type CoaWithJournalItems, type Journal, type JournalItem, type Coa } from '@/lib/types'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  const tenantId = session.tenantId as string
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const coas: CoaWithJournalItems[] = await db.coa.findMany({
    where: { tenantId },
    include: { journalItems: true }
  })

  const coasThisMonth: CoaWithJournalItems[] = await db.coa.findMany({
    where: { tenantId },
    include: {
      journalItems: {
        where: { journal: { date: { gte: startOfMonth } } }
      }
    }
  })

  const journalCount = await db.journal.count({ where: { tenantId } })

  const kasBank = coas
    .filter((c: Coa) => c.type === 'ASSET' && c.code.startsWith('1'))
    .reduce((sum: number, c: CoaWithJournalItems) => sum + calcCoaBalance(c), 0)

  const pendapatanBulanIni = coasThisMonth
    .filter((c: Coa) => c.type === 'REVENUE')
    .reduce((sum: number, c: CoaWithJournalItems) => sum + calcCoaBalance(c), 0)

  const bebanBulanIni = coasThisMonth
    .filter((c: Coa) => c.type === 'EXPENSE')
    .reduce((sum: number, c: CoaWithJournalItems) => sum + calcCoaBalance(c), 0)

  const recentJournals: (Journal & { items: (JournalItem & { coa: Coa })[] })[] = await db.journal.findMany({
    where: { tenantId },
    include: { items: { include: { coa: true } } },
    orderBy: { date: 'desc' },
    take: 5
  })

  const TYPE_LABEL: Record<string, string> = {
    ASSET: 'Aset', LIABILITY: 'Kewajiban', EQUITY: 'Ekuitas',
    REVENUE: 'Pendapatan', EXPENSE: 'Beban'
  }
  const TYPE_COLOR: Record<string, string> = {
    ASSET: 'bg-blue-500', LIABILITY: 'bg-red-400', EQUITY: 'bg-purple-500',
    REVENUE: 'bg-green-500', EXPENSE: 'bg-orange-400'
  }

  const totalRevenues = coas.filter((c: Coa) => c.type === 'REVENUE').reduce((s: number, c: CoaWithJournalItems) => s + calcCoaBalance(c), 0)
  const totalExpenses = coas.filter((c: Coa) => c.type === 'EXPENSE').reduce((s: number, c: CoaWithJournalItems) => s + calcCoaBalance(c), 0)
  const netIncome = totalRevenues - totalExpenses

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Ringkasan informasi keuangan BUMDes Anda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kas &amp; Bank</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(kasBank)}</div>
            <p className="text-xs text-muted-foreground">Saldo saat ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatRupiah(pendapatanBulanIni)}</div>
            <p className="text-xs text-muted-foreground">Total pendapatan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beban Bulan Ini</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatRupiah(bebanBulanIni)}</div>
            <p className="text-xs text-muted-foreground">Total beban operasional</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jurnal</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journalCount}</div>
            <p className="text-xs text-muted-foreground">Transaksi tercatat</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader><CardTitle>Ringkasan Posisi Keuangan</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map((type) => {
                const total = coas.filter((c: Coa) => c.type === type).reduce((s: number, c: CoaWithJournalItems) => s + calcCoaBalance(c), 0)
                return (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${TYPE_COLOR[type]}`} />
                      <span>{TYPE_LABEL[type]}</span>
                    </div>
                    <span className="font-medium">{formatRupiah(total)}</span>
                  </div>
                )
              })}
              <div className="border-t pt-2 flex justify-between text-sm font-bold">
                <span>Laba / Rugi Berjalan</span>
                <span className={netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatRupiah(netIncome)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader><CardTitle>Transaksi Terakhir</CardTitle></CardHeader>
          <CardContent>
            {recentJournals.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">Belum ada transaksi</div>
            ) : (
              <div className="space-y-3">
                {recentJournals.map((j: Journal & { items: JournalItem[] }) => {
                  const totalDebit = j.items.reduce((s: number, i: JournalItem) => s + i.debit, 0)
                  return (
                    <div key={j.id} className="flex justify-between items-start text-sm border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium truncate max-w-[160px]">{j.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(j.date), 'dd MMM yyyy', { locale: localeId })} · {j.number}
                        </p>
                      </div>
                      <span className="font-medium text-right shrink-0">{formatRupiah(totalDebit)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
