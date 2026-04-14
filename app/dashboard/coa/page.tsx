import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function CoaPage() {
  const session = await getSession()
  if (!session) return null

  const coas = await db.coa.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { code: 'asc' }
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ASSET': return 'bg-blue-100 text-blue-800'
      case 'LIABILITY': return 'bg-red-100 text-red-800'
      case 'EQUITY': return 'bg-purple-100 text-purple-800'
      case 'REVENUE': return 'bg-green-100 text-green-800'
      case 'EXPENSE': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chart of Accounts (COA)</h2>
          <p className="text-muted-foreground">
            Daftar akun perkiraan untuk BUMDes Anda.
          </p>
        </div>
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
                coas.map((coa) => (
                  <TableRow key={coa.id}>
                    <TableCell className="font-medium">{coa.code}</TableCell>
                    <TableCell>{coa.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getTypeColor(coa.type)}>
                        {coa.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {coa.normalBalance}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
