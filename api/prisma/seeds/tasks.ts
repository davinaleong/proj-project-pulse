import { PrismaClient } from '@prisma/client'

export async function seedTasks(prisma: PrismaClient) {
  const projectA = await prisma.project.findUnique({
    where: { title: 'Website Redesign' },
  })
  const projectB = await prisma.project.findUnique({
    where: { title: 'UI Component Library' },
  })
  const bob = await prisma.user.findUnique({
    where: { email: 'bob@example.com' },
  })

  const tasksData: Array<unknown> = []
  if (projectA) {
    tasksData.push({
      title: 'Audit accessibility issues',
      projectId: projectA.id,
      definitionOfDone: 'List of accessibility issues and proposed fixes',
      status: 'TODO',
    })
  }
  if (projectB && bob) {
    tasksData.push({
      title: 'Design button component',
      projectId: projectB.id,
      definitionOfDone: 'Accessible, theme-aware button component with docs',
      status: 'BACKLOG',
      userId: bob.id,
    })
  }

  const created: unknown[] = []
  type TaskSeed = {
    uuid?: string
    title: string
    projectId: string
    definitionOfDone?: string
    status?: string
    userId?: string
  }

  for (const t of tasksData as TaskSeed[]) {
    const uuid = t.uuid ?? `seed-${t.title.replace(/\s+/g, '-')}`
    const task = await prisma.task.upsert({
      where: { uuid },
      update: {
        title: t.title,
        definitionOfDone: t.definitionOfDone,
        status: t.status,
      },
      create: t,
    })
    created.push(task)
  }

  return created
}
