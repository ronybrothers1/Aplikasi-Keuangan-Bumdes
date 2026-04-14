import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function LaporanPage() {
  const session = await getSession()
  if (!session) return null

  // Fetch all COAs and their balances
  const coas = await db.coa.findMany({
    where: { tenantId: session.tenantId },
    include: {
      journalItems: {
        include: {
          journal: true
        }
      }
    },
    orderBy: { code: 'asc' }
  })

  // Calculate balances
  const balances = coas.map(coa => {
    let balance = 0
    coa.journalItems.forEach(item => {
      if (coa.normalBalance === 'DEBIT') {
        balance += item.debit - item.credit
      } else {
        balance += item.credit - item.debit
      }
    })
    return { ...coa, balance }
  })

  // Group by type
  const assets = balances.filter(c => c.type === 'ASSET')
  const liabilities = balances.filter(c => c.type === 'LIABILITY')
  const equities = balances.filter(c => c.type === 'EQUITY')
  const revenues = balances.filter(c => c.type === 'REVENUE')
  const expenses = balances.filter(c => c.type === 'EXPENSE')

  const totalAssets = assets.reduce((sum, c) => sum + c.balance, 0)
  const totalLiabilities = liabilities.reduce((sum, c) => sum + c.balance, 0)
  const totalEquities = equities.reduce((sum, c) => sum + c.balance, 0)
  const totalRevenues = revenues.reduce((sum, c) => sum + c.balance, 0)
  const totalExpenses = expenses.reduce((sum, c) => sum + c.balance, 0)

  const netIncome = totalRevenues - totalExpenses

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Laporan Keuangan</h2>
        <p className="text-muted-foreground">
          Laporan keuangan BUMDes otomatis berdasarkan jurnal.
        </p>
      </div>

      <Tabs defaultValue="neraca" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="neraca">Neraca (Balance Sheet)</TabsTrigger>
          <TabsTrigger value="labarugi">Laba Rugi (Income Statement)</TabsTrigger>
          <TabsTrigger value="neracasaldo">Neraca Saldo (Trial Balance)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="neraca" className="mt-6">
          <Card>
            <CardHeader className="text-center border-b pb-6">
              <CardTitle className="text-2xl uppercase">{session.tenantName}</CardTitle>
              <p className="text-muted-foreground font-medium">LAPORAN POSISI KEUANGAN (NERACA)</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Aset */}
                <div>
                  <h3 className="font-bold text-lg mb-4 border-b pb-2">ASET</h3>
                  <div className="space-y-2">
                    {assets.map(coa => (
                      <div key={coa.id} className="flex justify-between text-sm">
                        <span>{coa.name}</span>
                        <span>{new Intl.NumberFormat('id-ID').format(coa.balance)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold mt-4 pt-4 border-t">
                    <span>TOTAL ASET</span>
                    <span>{new Intl.NumberFormat('id-ID').format(totalAssets)}</span>
                  </div>
                </div>

                {/* Kewajiban & Ekuitas */}
                <div>
                  <h3 className="font-bold text-lg mb-4 border-b pb-2">KEWAJIBAN</h3>
                  <div className="space-y-2 mb-6">
                    {liabilities.map(coa => (
                      <div key={coa.id} className="flex justify-between text-sm">
                        <span>{coa.name}</span>
                        <span>{new Intl.NumberFormat('id-ID').format(coa.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t text-sm">
                      <span>Total Kewajiban</span>
                      <span>{new Intl.NumberFormat('id-ID').format(totalLiabilities)}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-4 border-b pb-2">EKUITAS</h3>
                  <div className="space-y-2">
                    {equities.map(coa => (
                      <div key={coa.id} className="flex justify-between text-sm">
                        <span>{coa.name}</span>
                        <span>{new Intl.NumberFormat('id-ID').format(coa.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm">
                      <span>Laba/Rugi Tahun Berjalan</span>
                      <span>{new Intl.NumberFormat('id-ID').format(netIncome)}</span>
                    </div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t text-sm">
                      <span>Total Ekuitas</span>
                      <span>{new Intl.NumberFormat('id-ID').format(totalEquities + netIncome)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-bold mt-4 pt-4 border-t">
                    <span>TOTAL KEWAJIBAN & EKUITAS</span>
                    <span>{new Intl.NumberFormat('id-ID').format(totalLiabilities + totalEquities + netIncome)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labarugi" className="mt-6">
          <Card>
            <CardHeader className="text-center border-b pb-6">
              <CardTitle className="text-2xl uppercase">{session.tenantName}</CardTitle>
              <p className="text-muted-foreground font-medium">LAPORAN LABA RUGI</p>
            </CardHeader>
            <CardContent className="pt-6 max-w-2xl mx-auto">
              <h3 className="font-bold text-lg mb-4 border-b pb-2">PENDAPATAN</h3>
              <div className="space-y-2 mb-6 pl-4">
                {revenues.map(coa => (
                  <div key={coa.id} className="flex justify-between text-sm">
                    <span>{coa.name}</span>
                    <span>{new Intl.NumberFormat('id-ID').format(coa.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold mt-2 pt-2 border-t text-sm">
                  <span>Total Pendapatan</span>
                  <span>{new Intl.NumberFormat('id-ID').format(totalRevenues)}</span>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-4 border-b pb-2">BEBAN OPERASIONAL</h3>
              <div className="space-y-2 mb-6 pl-4">
                {expenses.map(coa => (
                  <div key={coa.id} className="flex justify-between text-sm">
                    <span>{coa.name}</span>
                    <span>{new Intl.NumberFormat('id-ID').format(coa.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold mt-2 pt-2 border-t text-sm">
                  <span>Total Beban Operasional</span>
                  <span>({new Intl.NumberFormat('id-ID').format(totalExpenses)})</span>
                </div>
              </div>

              <div className="flex justify-between font-bold mt-8 pt-4 border-t-2 text-lg">
                <span>LABA (RUGI) BERSIH</span>
                <span className={netIncome < 0 ? 'text-red-600' : 'text-green-600'}>
                  {new Intl.NumberFormat('id-ID').format(netIncome)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="neracasaldo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Neraca Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Akun</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Kredit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map(coa => {
                    const isDebit = coa.normalBalance === 'DEBIT'
                    const debitAmount = isDebit && coa.balance > 0 ? coa.balance : (!isDebit && coa.balance < 0 ? Math.abs(coa.balance) : 0)
                    const creditAmount = !isDebit && coa.balance > 0 ? coa.balance : (isDebit && coa.balance < 0 ? Math.abs(coa.balance) : 0)
                    
                    if (debitAmount === 0 && creditAmount === 0) return null

                    return (
                      <TableRow key={coa.id}>
                        <TableCell>{coa.code}</TableCell>
                        <TableCell>{coa.name}</TableCell>
                        <TableCell className="text-right">
                          {debitAmount > 0 ? new Intl.NumberFormat('id-ID').format(debitAmount) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {creditAmount > 0 ? new Intl.NumberFormat('id-ID').format(creditAmount) : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
