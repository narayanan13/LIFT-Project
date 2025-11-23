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
    return
  }
  const user = await prisma.user.create({ data: { name: 'Admin', email: adminEmail, passwordHash, role: 'ADMIN' } })
  console.log('Created admin:', user.email)
}

main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=>prisma.$disconnect())
// Duplicate CommonJS seed script removed to avoid redeclaration of prisma
