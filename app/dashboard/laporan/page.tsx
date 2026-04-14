import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Coa, JournalItem } from '@/lib/types'

type CoaWithItems = Coa & { journalItems: JournalItem[] }
type CoaWithBalance = CoaWithItems & { balance: number }

function calcBalance(coa: CoaWithItems): number {
  return coa.journalItems.reduce((sum: number, item: JournalItem) => {
    return coa.normalBalance === 'DEBIT'
      ? sum + item.debit - item.credit
      : sum + item.credit - item.debit
  }, 0)
}

function formatRupiah(v: number): string {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(v)
}

export default async function LaporanPage() {
  const session = await getSession()
  if (!session) return null

  const coas: CoaWithItems[] = await db.coa.findMany({
    where: { tenantId: session.tenantId as string },
    include: {
      journalItems: {
        include: { journal: true }
      }
    },
    orderBy: { code: 'asc' }
  })

  const balances: CoaWithBalance[] = coas.map((coa: CoaWithItems) => ({
    ...coa,
    balance: calcBalance(coa)
  }))

  const assets = balances.filter((c: CoaWithBalance) => c.type === 'ASSET')
  const liabilities = balances.filter((c: CoaWithBalance) => c.type === 'LIABILITY')
  const equities = balances.filter((c: CoaWithBalance) => c.type === 'EQUITY')
  const revenues = balances.filter((c: CoaWithBalance) => c.type === 'REVENUE')
  const expenses = balances.filter((c: CoaWithBalance) => c.type === 'EXPENSE')

  const totalAssets = assets.reduce((sum: number, c: CoaWithBalance) => sum + c.balance, 0)
  const totalLiabilities = liabilities.reduce((sum: number, c: CoaWithBalance) => sum + c.balance, 0)
  const totalEquities = equities.reduce((sum: number, c: CoaWithBalance) => sum + c.balance, 0)
  const totalRevenues = revenues.reduce((sum: number, c: CoaWithBalance) => sum + c.balance, 0)
  const totalExpenses = expenses.reduce((sum: number, c: CoaWithBalance) => sum + c.balance, 0)
  const netIncome = totalRevenues - totalExpenses

  const totalDebitNeraca = balances.reduce((sum: number, c: CoaWithBalance) => {
    const isDebit = c.normalBalance === 'DEBIT'
    return sum + (isDebit && c.balance > 0 ? c.balance : (!isDebit && c.balance < 0 ? Math.abs(c.balance) : 0))
  }, 0)
  const totalCreditNeraca = balances.reduce((sum: number, c: CoaWithBalance) => {
    const isDebit = c.normalBalance === 'DEBIT'
    return sum + (!isDebit && c.balance > 0 ? c.balance : (isDebit && c.balance < 0 ? Math.abs(c.balance) : 0))
  }, 0)

  const ReportRow = ({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) => (
    <div className={`flex justify-between ${bold ? 'font-bold border-t pt-2 mt-2' : 'text-sm'}`}>
      <span>{label}</span>
      <span>{formatRupiah(value)}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Laporan Keuangan</h2>
        <p className="text-muted-foreground">Laporan keuangan BUMDes otomatis berdasarkan jurnal.</p>
      </div>

      <Tabs defaultValue="neraca" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="neraca">Neraca</TabsTrigger>
          <TabsTrigger value="labarugi">Laba Rugi</TabsTrigger>
          <TabsTrigger value="neracasaldo">Neraca Saldo</TabsTrigger>
        </TabsList>

        {/* === NERACA === */}
        <TabsContent value="neraca" className="mt-6">
          <Card>
            <CardHeader className="text-center border-b pb-6">
              <CardTitle className="text-2xl uppercase">{session.tenantName as string}</CardTitle>
              <p className="text-muted-foreground font-medium">LAPORAN POSISI KEUANGAN (NERACA)</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Aset */}
                <div>
                  <h3 className="font-bold text-lg mb-4 border-b pb-2">ASET</h3>
                  <div className="space-y-2">
                    {assets.map((coa: CoaWithBalance) => (
                      <ReportRow key={coa.id} label={`${coa.code} - ${coa.name}`} value={coa.balance} />
                    ))}
                  </div>
                  <ReportRow label="TOTAL ASET" value={totalAssets} bold />
                </div>

                {/* Kewajiban & Ekuitas */}
                <div>
                  <h3 className="font-bold text-lg mb-4 border-b pb-2">KEWAJIBAN</h3>
                  <div className="space-y-2">
                    {liabilities.map((coa: CoaWithBalance) => (
                      <ReportRow key={coa.id} label={`${coa.code} - ${coa.name}`} value={coa.balance} />
                    ))}
                  </div>
                  <ReportRow label="Total Kewajiban" value={totalLiabilities} bold />

                  <h3 className="font-bold text-lg mt-6 mb-4 border-b pb-2">EKUITAS</h3>
                  <div className="space-y-2">
                    {equities.map((coa: CoaWithBalance) => (
                      <ReportRow key={coa.id} label={`${coa.code} - ${coa.name}`} value={coa.balance} />
                    ))}
                    <div className="flex justify-between text-sm">
                      <span>Laba/Rugi Tahun Berjalan</span>
                      <span className={netIncome < 0 ? 'text-red-600' : 'text-green-600'}>
                        {netIncome < 0 ? `(${formatRupiah(Math.abs(netIncome))})` : formatRupiah(netIncome)}
                      </span>
                    </div>
                  </div>
                  <ReportRow label="Total Ekuitas" value={totalEquities + netIncome} bold />
                  <ReportRow label="TOTAL KEWAJIBAN & EKUITAS" value={totalLiabilities + totalEquities + netIncome} bold />
                </div>
              </div>

              {/* Balance check */}
              {Math.abs(totalAssets - (totalLiabilities + totalEquities + netIncome)) > 1 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  ⚠ Neraca tidak seimbang. Periksa kembali entri jurnal Anda.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === LABA RUGI === */}
        <TabsContent value="labarugi" className="mt-6">
          <Card>
            <CardHeader className="text-center border-b pb-6">
              <CardTitle className="text-2xl uppercase">{session.tenantName as string}</CardTitle>
              <p className="text-muted-foreground font-medium">LAPORAN LABA RUGI</p>
            </CardHeader>
            <CardContent className="pt-6 max-w-2xl mx-auto">
              <h3 className="font-bold text-lg mb-4 border-b pb-2">PENDAPATAN</h3>
              <div className="space-y-2 mb-6 pl-4">
                {revenues.map((coa: CoaWithBalance) => (
                  <ReportRow key={coa.id} label={`${coa.code} - ${coa.name}`} value={coa.balance} />
                ))}
                <ReportRow label="Total Pendapatan" value={totalRevenues} bold />
              </div>

              <h3 className="font-bold text-lg mb-4 border-b pb-2">BEBAN OPERASIONAL</h3>
              <div className="space-y-2 mb-6 pl-4">
                {expenses.map((coa: CoaWithBalance) => (
                  <ReportRow key={coa.id} label={`${coa.code} - ${coa.name}`} value={coa.balance} />
                ))}
                <div className="flex justify-between font-bold border-t pt-2 mt-2 text-sm">
                  <span>Total Beban Operasional</span>
                  <span>({formatRupiah(totalExpenses)})</span>
                </div>
              </div>

              <div className={`flex justify-between font-bold mt-8 pt-4 border-t-2 text-lg ${netIncome < 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span>LABA (RUGI) BERSIH</span>
                <span>{netIncome < 0 ? `(${formatRupiah(Math.abs(netIncome))})` : formatRupiah(netIncome)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === NERACA SALDO === */}
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
                  {balances.map((coa: CoaWithBalance) => {
                    const isDebit = coa.normalBalance === 'DEBIT'
                    const debitAmount = (isDebit && coa.balance > 0) ? coa.balance : (!isDebit && coa.balance < 0 ? Math.abs(coa.balance) : 0)
                    const creditAmount = (!isDebit && coa.balance > 0) ? coa.balance : (isDebit && coa.balance < 0 ? Math.abs(coa.balance) : 0)
                    if (debitAmount === 0 && creditAmount === 0) return null
                    return (
                      <TableRow key={coa.id}>
                        <TableCell className="font-mono">{coa.code}</TableCell>
                        <TableCell>{coa.name}</TableCell>
                        <TableCell className="text-right">
                          {debitAmount > 0 ? formatRupiah(debitAmount) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {creditAmount > 0 ? formatRupiah(creditAmount) : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="font-bold bg-muted/50 border-t-2">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-right">{formatRupiah(totalDebitNeraca)}</TableCell>
                    <TableCell className={`text-right ${Math.abs(totalDebitNeraca - totalCreditNeraca) > 1 ? 'text-red-600' : ''}`}>
                      {formatRupiah(totalCreditNeraca)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
