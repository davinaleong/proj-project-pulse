import { PrismaClient, ProjectStage } from '@prisma/client'

export async function seedProjects(prisma: PrismaClient) {
  // Create one project per seeded user where applicable.
  const alice = await prisma.user.findUnique({
    where: { email: 'alice@example.com' },
  })
  const bob = await prisma.user.findUnique({
    where: { email: 'bob@example.com' },
  })

  const projectsData = [] as any[]
  if (alice) {
    projectsData.push({
      uuid: 'seed-project-website-redesign',
      title: 'Website Redesign',
      description: 'Improve UI and accessibility for the marketing site.',
      stage: ProjectStage.IMPLEMENTATION,
      userId: alice.id,
    })
  }
  if (bob) {
    projectsData.push({
      uuid: 'seed-project-ui-component-library',
      title: 'UI Component Library',
      description: 'Shared React components for internal projects.',
      stage: ProjectStage.PLANNING,
      userId: bob.id,
    })
  }

  const created: unknown[] = []
  for (const p of projectsData) {
    const project = await prisma.project.upsert({
      where: { uuid: p.uuid },
      update: { title: p.title, description: p.description, stage: p.stage },
      create: p,
    })
    created.push(project)
  }

  return created
}
