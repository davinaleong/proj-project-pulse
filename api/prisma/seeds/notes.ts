import { PrismaClient } from '@prisma/client'

export async function seedNotes(prisma: PrismaClient) {
  const alice = await prisma.user.findUnique({
    where: { email: 'alice@example.com' },
  })
  const project = await prisma.project.findFirst({
    where: { title: 'Website Redesign' },
  })

  const notesData: Array<unknown> = []
  if (alice) {
    notesData.push({
      title: 'Kickoff notes',
      description: 'Initial meeting notes and goals',
      body: 'Discuss timeline and deliverables.',
      status: 'PUBLISHED',
      userId: alice.id,
      projectId: project?.id || null,
    })
  }

  const created: unknown[] = []
  type NoteSeed = {
    uuid?: string
    title: string
    description?: string
    body?: string
    status?: string
    userId?: string
    projectId?: string | null
  }

  for (const n of notesData as NoteSeed[]) {
    const uuid = n.uuid ?? `seed-note-${n.title.replace(/\s+/g, '-')}`
    const note = await prisma.note.upsert({
      where: { uuid },
      update: { title: n.title, description: n.description, body: n.body },
      create: n,
    })
    created.push(note)
  }

  return created
}
