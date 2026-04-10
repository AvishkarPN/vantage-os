import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding VantageOS Persistence Layer...')

  // 1. Users
  const master = await prisma.user.upsert({
    where: { email: 'master@vantage.os' },
    update: {},
    create: {
      email: 'master@vantage.os',
      name: 'root_admin',
      role: 'ADMIN',
    },
  })

  const operator = await prisma.user.upsert({
    where: { email: 'operator@vantage.os' },
    update: {},
    create: {
      email: 'operator@vantage.os',
      name: 'op_alpha',
      role: 'OPERATOR',
    },
  })

  // 2. Venue & Zones
  const venue = await prisma.venue.create({
    data: {
      name: 'Vantage Expo Center',
      capacity: 2500,
      zones: {
        create: [
          { name: 'Main Stage', capacity: 600 },
          { name: 'Hall A', capacity: 300 },
          { name: 'Hall B', capacity: 120 },
          { name: 'Expo Floor', capacity: 800 },
        ]
      }
    }
  })

  // 3. Initial Audit
  await prisma.auditLog.create({
    data: {
      userId: master.id,
      action: 'SYSTEM_INITIALIZATION',
      severity: 'LOW',
      status: 'SUCCESS'
    }
  })

  console.log('✅ Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
