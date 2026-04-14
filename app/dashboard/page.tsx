import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) return null

  // Fetch some summary data
  // For a real app, we would calculate this from the journal entries
  // For now, we'll just show placeholders or basic counts
  
  const journalCount = await db.journal.count({
    where: { tenantId: session.tenantId }
  })

  const coaCount = await db.coa.count({
    where: { tenantId: session.tenantId }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Ringkasan informasi keuangan BUMDes Anda.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kas & Bank</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 0</div>
            <p className="text-xs text-muted-foreground">
              Saldo saat ini
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 0</div>
            <p className="text-xs text-muted-foreground">
              Total pendapatan
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beban Bulan Ini</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 0</div>
            <p className="text-xs text-muted-foreground">
              Total beban operasional
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jurnal</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journalCount}</div>
            <p className="text-xs text-muted-foreground">
              Transaksi tercatat
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Grafik Arus Kas</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md m-4">
              Belum ada data transaksi untuk ditampilkan
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Transaksi Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {journalCount === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Belum ada transaksi
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Menampilkan transaksi terakhir...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
