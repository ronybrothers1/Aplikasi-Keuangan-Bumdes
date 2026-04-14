import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function TenantsPage() {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  const tenants = await db.tenant.findMany({
    include: {
      _count: {
        select: { users: true, journals: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Kelola BUMDes</h2>
        <p className="text-muted-foreground">
          Manajemen multi-tenant BUMDes (Khusus Super Admin).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar BUMDes Terdaftar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama BUMDes</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead className="text-center">Jumlah User</TableHead>
                <TableHead className="text-center">Jumlah Transaksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{format(new Date(tenant.createdAt), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-center">{tenant._count.users}</TableCell>
                  <TableCell className="text-center">{tenant._count.journals}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
