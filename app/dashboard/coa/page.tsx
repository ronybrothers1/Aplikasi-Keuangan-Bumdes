import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { Coa } from '@/lib/types'

const TYPE_LABEL: Record<string, string> = {
  ASSET: 'Aset', LIABILITY: 'Kewajiban', EQUITY: 'Ekuitas',
  REVENUE: 'Pendapatan', EXPENSE: 'Beban'
}

const TYPE_COLOR: Record<string, string> = {
  ASSET: 'bg-blue-100 text-blue-800',
  LIABILITY: 'bg-red-100 text-red-800',
  EQUITY: 'bg-purple-100 text-purple-800',
  REVENUE: 'bg-green-100 text-green-800',
  EXPENSE: 'bg-orange-100 text-orange-800',
}

export default async function CoaPage() {
  const session = await getSession()
  if (!session) return null

  const coas: Coa[] = await db.coa.findMany({
    where: { tenantId: session.tenantId as string },
    orderBy: { code: 'asc' }
  })

  const grouped = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map((type) => ({
    type,
    items: coas.filter((c: Coa) => c.type === type)
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chart of Accounts (COA)</h2>
          <p className="text-muted-foreground">Daftar akun perkiraan untuk BUMDes Anda.</p>
        </div>
        <div className="text-sm text-muted-foreground">{coas.length} akun terdaftar</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Kode</TableHead>
                <TableHead>Nama Akun</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Saldo Normal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Belum ada data COA.
                  </TableCell>
                </TableRow>
              ) : (
                grouped.map(({ type, items }) =>
                  items.map((coa: Coa, idx: number) => (
                    <TableRow key={coa.id} className={idx === 0 ? 'border-t-2' : ''}>
                      <TableCell className="font-mono font-medium">{coa.code}</TableCell>
                      <TableCell>{coa.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={TYPE_COLOR[type] ?? 'bg-gray-100 text-gray-800'}>
                          {TYPE_LABEL[type] ?? type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{coa.normalBalance}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
