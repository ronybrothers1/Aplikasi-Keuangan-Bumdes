'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteJurnalButton({ journalId }: { journalId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus jurnal ini? Tindakan ini tidak dapat dibatalkan.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/jurnal/${journalId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Jurnal berhasil dihapus')
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus jurnal')
      }
    } catch {
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-red-500 hover:text-red-700 hover:bg-red-50"
      onClick={handleDelete}
      disabled={loading}
      title="Hapus Jurnal"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  )
}
