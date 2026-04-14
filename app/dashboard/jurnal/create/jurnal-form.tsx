'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

type Coa = {
  id: string
  code: string
  name: string
}

type JournalItem = {
  id: string
  coaId: string
  debit: number
  credit: number
}

export function JurnalForm({ coas }: { coas: Coa[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<JournalItem[]>([
    { id: '1', coaId: '', debit: 0, credit: 0 },
    { id: '2', coaId: '', debit: 0, credit: 0 }
  ])

  const totalDebit = items.reduce((sum, item) => sum + (Number(item.debit) || 0), 0)
  const totalCredit = items.reduce((sum, item) => sum + (Number(item.credit) || 0), 0)
  const isBalanced = totalDebit === totalCredit && totalDebit > 0

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), coaId: '', debit: 0, credit: 0 }])
  }

  const removeItem = (id: string) => {
    if (items.length <= 2) {
      toast.error('Minimal harus ada 2 baris jurnal')
      return
    }
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof JournalItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'debit' && value > 0) updated.credit = 0
        if (field === 'credit' && value > 0) updated.debit = 0
        return updated
      }
      return item
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
          description,
          items: items.map(item => ({
            coaId: item.coaId,
            debit: Number(item.debit) || 0,
            credit: Number(item.credit) || 0
          }))
        })
      })

      if (res.ok) {
        toast.success('Jurnal berhasil disimpan')
        router.push('/dashboard/jurnal')
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan jurnal')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

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

            <div className="border rounded-md">
              <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 font-medium text-sm border-b">
                <div className="col-span-5">Akun</div>
                <div className="col-span-3 text-right">Debit (Rp)</div>
                <div className="col-span-3 text-right">Kredit (Rp)</div>
                <div className="col-span-1 text-center">Aksi</div>
              </div>
              
              <div className="divide-y">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 p-3 items-center">
                    <div className="col-span-5">
                      <Select
                        value={item.coaId}
                        onValueChange={(val) => updateItem(item.id, 'coaId', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Akun" />
                        </SelectTrigger>
                        <SelectContent>
                          {coas.map(coa => (
                            <SelectItem key={coa.id} value={coa.id}>
                              {coa.code} - {coa.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        className="text-right"
                        value={item.debit || ''}
                        onChange={(e) => updateItem(item.id, 'debit', e.target.value)}
                        disabled={item.credit > 0}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        className="text-right"
                        value={item.credit || ''}
                        onChange={(e) => updateItem(item.id, 'credit', e.target.value)}
                        disabled={item.debit > 0}
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-12 gap-4 p-3 bg-muted/30 font-bold border-t">
                <div className="col-span-5 text-right">Total:</div>
                <div className={`col-span-3 text-right ${!isBalanced && totalDebit > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {new Intl.NumberFormat('id-ID').format(totalDebit)}
                </div>
                <div className={`col-span-3 text-right ${!isBalanced && totalCredit > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {new Intl.NumberFormat('id-ID').format(totalCredit)}
                </div>
                <div className="col-span-1"></div>
              </div>
            </div>
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
