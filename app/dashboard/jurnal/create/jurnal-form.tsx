'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'

type Coa = { id: string; code: string; name: string; type: string; normalBalance: string }

type JournalItem = { id: string; coaId: string; debit: string; credit: string }

const formatRupiah = (v: number) =>
  new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(v)

export function JurnalForm({ coas }: { coas: Coa[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<JournalItem[]>([
    { id: '1', coaId: '', debit: '', credit: '' },
    { id: '2', coaId: '', debit: '', credit: '' }
  ])

  // Use integer cents to avoid floating-point comparison issues
  const totalDebitCents = items.reduce((sum, item) => sum + Math.round((parseFloat(item.debit) || 0) * 100), 0)
  const totalCreditCents = items.reduce((sum, item) => sum + Math.round((parseFloat(item.credit) || 0) * 100), 0)
  const totalDebit = totalDebitCents / 100
  const totalCredit = totalCreditCents / 100
  const isBalanced = totalDebitCents === totalCreditCents && totalDebitCents > 0

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36).slice(2), coaId: '', debit: '', credit: '' }])
  }

  const removeItem = (id: string) => {
    if (items.length <= 2) {
      toast.error('Minimal harus ada 2 baris jurnal')
      return
    }
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof JournalItem, value: string) => {
    setItems(items.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      // Auto-clear opposite side when a value is entered
      if (field === 'debit' && parseFloat(value) > 0) updated.credit = ''
      if (field === 'credit' && parseFloat(value) > 0) updated.debit = ''
      return updated
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      toast.error('Keterangan transaksi harus diisi')
      return
    }
    if (!isBalanced) {
      toast.error('Jurnal tidak balance! Total Debit harus sama dengan Total Kredit.')
      return
    }
    if (items.some(item => !item.coaId)) {
      toast.error('Pilih akun untuk semua baris jurnal.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/jurnal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          description: description.trim(),
          items: items.map(item => ({
            coaId: item.coaId,
            debit: parseFloat(item.debit) || 0,
            credit: parseFloat(item.credit) || 0
          }))
        })
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`Jurnal ${data.journal?.number ?? ''} berhasil disimpan`)
        router.push('/dashboard/jurnal')
        router.refresh()
      } else {
        toast.error(data.error || 'Gagal menyimpan jurnal')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  // Group COAs by type for easier selection
  const coaGroups = [
    { label: 'Aset', items: coas.filter(c => c.type === 'ASSET') },
    { label: 'Kewajiban', items: coas.filter(c => c.type === 'LIABILITY') },
    { label: 'Ekuitas', items: coas.filter(c => c.type === 'EQUITY') },
    { label: 'Pendapatan', items: coas.filter(c => c.type === 'REVENUE') },
    { label: 'Beban', items: coas.filter(c => c.type === 'EXPENSE') },
  ].filter(g => g.items.length > 0)

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal Transaksi</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Keterangan</Label>
              <Input
                id="description"
                placeholder="Contoh: Penerimaan pendapatan jasa"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Detail Jurnal</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Baris
              </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm border-b">
                <div className="col-span-5">Akun</div>
                <div className="col-span-3 text-right">Debit (Rp)</div>
                <div className="col-span-3 text-right">Kredit (Rp)</div>
                <div className="col-span-1" />
              </div>

              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 p-3 items-center">
                    <div className="col-span-5">
                      <Select
                        value={item.coaId}
                        onValueChange={(val) => updateItem(item.id, 'coaId', val ?? '')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Akun" />
                        </SelectTrigger>
                        <SelectContent>
                          {coaGroups.map(group => (
                            <div key={group.label}>
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {group.label}
                              </div>
                              {group.items.map(coa => (
                                <SelectItem key={coa.id} value={coa.id}>
                                  {coa.code} - {coa.name}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        className="text-right"
                        placeholder="0"
                        value={item.debit}
                        onChange={(e) => updateItem(item.id, 'debit', e.target.value)}
                        disabled={!!(item.credit && parseFloat(item.credit) > 0)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        className="text-right"
                        placeholder="0"
                        value={item.credit}
                        onChange={(e) => updateItem(item.id, 'credit', e.target.value)}
                        disabled={!!(item.debit && parseFloat(item.debit) > 0)}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 h-8 w-8"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals row */}
              <div className="grid grid-cols-12 gap-2 p-3 bg-muted/30 font-bold border-t">
                <div className="col-span-5 text-right text-sm">Total:</div>
                <div className={`col-span-3 text-right ${totalDebit > 0 && !isBalanced ? 'text-red-500' : totalDebit > 0 ? 'text-green-700' : ''}`}>
                  {formatRupiah(totalDebit)}
                </div>
                <div className={`col-span-3 text-right ${totalCredit > 0 && !isBalanced ? 'text-red-500' : totalCredit > 0 ? 'text-green-700' : ''}`}>
                  {formatRupiah(totalCredit)}
                </div>
                <div className="col-span-1 flex justify-center">
                  {totalDebit > 0 && (
                    isBalanced
                      ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                      : <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Balance status message */}
            {totalDebit > 0 && !isBalanced && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Jurnal belum balance. Selisih:{' '}
                  <strong>Rp {formatRupiah(Math.abs(totalDebit - totalCredit))}</strong>
                </span>
              </div>
            )}
            {isBalanced && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Jurnal balance ✓ — siap disimpan</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t p-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Batal
          </Button>
          <Button type="submit" disabled={loading || !isBalanced}>
            {loading ? 'Menyimpan...' : 'Simpan Jurnal'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
