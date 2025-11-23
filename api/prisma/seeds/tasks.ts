import { PrismaClient, TaskStatus } from '@prisma/client'

export async function seedTasks(prisma: PrismaClient) {
  const projectA = await prisma.project.findUnique({
    where: { uuid: 'seed-project-website-redesign' },
  })
  const projectB = await prisma.project.findUnique({
    where: { uuid: 'seed-project-ui-component-library' },
  })
  const bob = await prisma.user.findUnique({
    where: { email: 'bob@example.com' },
  })

  const tasksData: Array<any> = []
  if (projectA) {
    tasksData.push({
      uuid: 'seed-task-audit-accessibility',
      title: 'Audit accessibility issues',
      projectId: projectA.id,
      definitionOfDone: 'List of accessibility issues and proposed fixes',
      status: TaskStatus.TODO,
    })
  }
  if (projectB && bob) {
    tasksData.push({
      uuid: 'seed-task-design-button',
      title: 'Design button component',
      projectId: projectB.id,
      definitionOfDone: 'Accessible, theme-aware button component with docs',
      status: TaskStatus.BACKLOG,
      userId: bob.id,
    })
  }

  const created: unknown[] = []
  for (const t of tasksData) {
    const task = await prisma.task.upsert({
      where: { uuid: t.uuid },
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
