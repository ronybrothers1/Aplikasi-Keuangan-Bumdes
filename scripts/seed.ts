import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'rony.bersahaja@gmail.com' },
    update: {},
    create: {
      email: 'rony.bersahaja@gmail.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  })

  console.log('Super Admin created:', superAdmin.email)

  // Create a sample BUMDes (Tenant)
  const tenant = await prisma.tenant.create({
    data: {
      name: 'BUMDes Maju Bersama',
    },
  })

  // Create Admin for BUMDes
  await prisma.user.upsert({
    where: { email: 'admin@majubersama.com' },
    update: {},
    create: {
      email: 'admin@majubersama.com',
      name: 'Admin BUMDes',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  })

  // Create Operator for BUMDes
  await prisma.user.upsert({
    where: { email: 'operator@majubersama.com' },
    update: {},
    create: {
      email: 'operator@majubersama.com',
      name: 'Operator BUMDes',
      password: hashedPassword,
      role: 'OPERATOR',
      tenantId: tenant.id,
    },
  })

  // Create initial COA for the Tenant
  const coas = [
    { code: '1000', name: 'Kas & Bank', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1100', name: 'Piutang Usaha', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1200', name: 'Persediaan', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '2000', name: 'Utang Usaha', type: 'LIABILITY', normalBalance: 'CREDIT' },
    { code: '3000', name: 'Modal BUMDes', type: 'EQUITY', normalBalance: 'CREDIT' },
    { code: '4000', name: 'Pendapatan Usaha', type: 'REVENUE', normalBalance: 'CREDIT' },
    { code: '5000', name: 'Beban Operasional', type: 'EXPENSE', normalBalance: 'DEBIT' },
  ]

  for (const coa of coas) {
    await prisma.coa.create({
      data: {
        ...coa,
        tenantId: tenant.id,
      },
    })
  }

  console.log('Sample data created for BUMDes Maju Bersama')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
