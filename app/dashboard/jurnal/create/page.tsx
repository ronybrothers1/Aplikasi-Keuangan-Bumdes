import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { JurnalForm } from './jurnal-form'

export default async function CreateJurnalPage() {
  const session = await getSession()
  if (!session) return null

  const coas = await db.coa.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { code: 'asc' }
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tambah Jurnal Baru</h2>
        <p className="text-muted-foreground">
          Masukkan detail transaksi dengan prinsip double entry (Debit = Kredit).
        </p>
      </div>

      <JurnalForm coas={coas} />
    </div>
  )
}
