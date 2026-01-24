import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/auth.js'

const prisma = new PrismaClient()

async function main(){
  const adminEmail = 'admin@lift.org'
  const passwordHash = hashPassword('admin1234')
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (existing) {
    await prisma.user.update({ where: { email: adminEmail }, data: { passwordHash, active: true } })
    console.log('Updated admin:', existing.email)
  } else {
    const user = await prisma.user.create({ data: { name: 'Admin', email: adminEmail, passwordHash, role: 'ADMIN' } })
    console.log('Created admin:', user.email)
  }

  // Seed default settings
  const defaultSettings = [
    {
      key: 'basic_contribution_split_lift',
      value: '50',
      description: 'Percentage of BASIC contributions allocated to LIFT bucket (0-100). Remainder goes to Alumni Association.'
    }
  ]

  for (const setting of defaultSettings) {
    const existingSetting = await prisma.settings.findUnique({ where: { key: setting.key } })
    if (!existingSetting) {
      await prisma.settings.create({ data: setting })
      console.log('Created setting:', setting.key)
    } else {
      console.log('Setting already exists:', setting.key)
    }
  }
}

main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=>prisma.$disconnect())
// Duplicate CommonJS seed script removed to avoid redeclaration of prisma
