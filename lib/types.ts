// Shared domain types matching the Prisma schema
// Used because @prisma/client model types are not available without prisma generate

export type Tenant = {
  id: string
  name: string
  createdAt: Date
}

export type User = {
  id: string
  email: string
  password: string
  name: string
  role: string
  tenantId: string | null
  createdAt: Date
}

export type Unit = {
  id: string
  name: string
  tenantId: string
}

export type Coa = {
  id: string
  code: string
  name: string
  type: string         // ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
  normalBalance: string // DEBIT | CREDIT
  tenantId: string
}

export type Journal = {
  id: string
  number: string
  date: Date
  description: string
  tenantId: string
  unitId: string | null
  createdAt: Date
  createdBy: string
}

export type JournalItem = {
  id: string
  journalId: string
  coaId: string
  debit: number
  credit: number
}

export type AuditTrail = {
  id: string
  action: string
  tableName: string
  recordId: string
  oldData: string | null
  newData: string | null
  userId: string
  tenantId: string
  createdAt: Date
}

// Composed types
export type JournalWithItems = Journal & {
  items: (JournalItem & { coa: Coa })[]
}

export type CoaWithJournalItems = Coa & {
  journalItems: (JournalItem & { journal?: Journal })[]
}

export type CoaWithBalance = CoaWithJournalItems & {
  balance: number
}

export type TenantWithCount = Tenant & {
  _count: { users: number; journals: number }
}

// Financial helpers
export function calcCoaBalance(coa: CoaWithJournalItems): number {
  return coa.journalItems.reduce((sum: number, item: JournalItem) => {
    return coa.normalBalance === 'DEBIT'
      ? sum + item.debit - item.credit
      : sum + item.credit - item.debit
  }, 0)
}

export function formatRupiah(v: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(v)
}

export function formatRupiahPlain(v: number): string {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(v)
}
