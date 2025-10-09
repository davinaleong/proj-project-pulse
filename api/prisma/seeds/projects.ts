import { PrismaClient } from '@prisma/client'

export async function seedProjects(prisma: PrismaClient) {
  // Create one project per seeded user where applicable.
  const alice = await prisma.user.findUnique({
    where: { email: 'alice@example.com' },
  })
  const bob = await prisma.user.findUnique({
    where: { email: 'bob@example.com' },
  })

  const projectsData = [] as unknown[]
  if (alice) {
    projectsData.push({
      title: 'Website Redesign',
      description: 'Improve UI and accessibility for the marketing site.',
      stage: 'IMPLEMENTATION',
      userId: alice.id,
    })
  }
  if (bob) {
    projectsData.push({
      title: 'UI Component Library',
      description: 'Shared React components for internal projects.',
      stage: 'PLANNING',
      userId: bob.id,
    })
  }

  const created: unknown[] = []
  type ProjectSeed = {
    title: string
    description?: string
    stage?: string
    userId?: string
  }
  for (const p of projectsData as ProjectSeed[]) {
    const project = await prisma.project.upsert({
      where: { title: p.title },
      update: { description: p.description, stage: p.stage },
      create: p,
    })
    created.push(project)
  }

  return created
}
