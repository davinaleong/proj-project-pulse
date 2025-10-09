import { PrismaClient } from '@prisma/client'
import { seedUsers } from './seeds/users'
import { seedProjects } from './seeds/projects'
import { seedTasks } from './seeds/tasks'
import { seedNotes } from './seeds/notes'
import { seedSettings } from './seeds/settings'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  await seedUsers(prisma)
  await seedProjects(prisma)
  await seedTasks(prisma)
  await seedNotes(prisma)
  await seedSettings(prisma)

  console.log('✅ Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
