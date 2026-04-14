import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogoutButton } from './logout-button'
import {
  LayoutDashboard,
  BookOpen,
  BookText,
  FileText,
  Settings,
  Building2
} from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <Building2 className="w-6 h-6 mr-2 text-primary" />
          <span className="font-bold text-lg truncate" title={session.tenantName}>
            {session.tenantName || 'BUMDes App'}
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Button>
          </Link>
          
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Master Data
          </div>
          <Link href="/dashboard/coa">
            <Button variant="ghost" className="w-full justify-start">
              <BookOpen className="w-5 h-5 mr-3" />
              Chart of Accounts
            </Button>
          </Link>
          <Link href="/dashboard/users">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="w-5 h-5 mr-3" />
              Pengguna
            </Button>
          </Link>

          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Transaksi
          </div>
          <Link href="/dashboard/jurnal">
            <Button variant="ghost" className="w-full justify-start">
              <BookText className="w-5 h-5 mr-3" />
              Jurnal Umum
            </Button>
          </Link>

          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Laporan
          </div>
          <Link href="/dashboard/buku-besar">
            <Button variant="ghost" className="w-full justify-start">
              <BookOpen className="w-5 h-5 mr-3" />
              Buku Besar
            </Button>
          </Link>
          <Link href="/dashboard/laporan">
            <Button variant="ghost" className="w-full justify-start">
              <FileText className="w-5 h-5 mr-3" />
              Laporan Keuangan
            </Button>
          </Link>

          {session.role === 'SUPER_ADMIN' && (
            <>
              <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </div>
              <Link href="/dashboard/tenants">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="w-5 h-5 mr-3" />
                  Kelola BUMDes
                </Button>
              </Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium truncate">{session.name}</p>
            <p className="text-xs text-muted-foreground truncate">{session.email}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{session.role.replace('_', ' ')}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-6 justify-between">
          <h1 className="text-xl font-semibold">Sistem Informasi Keuangan BUMDes</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
