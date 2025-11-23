import { PrismaClient, NoteStatus } from '@prisma/client'

export async function seedNotes(prisma: PrismaClient) {
  const alice = await prisma.user.findUnique({
    where: { email: 'alice@example.com' },
  })
  const project = await prisma.project.findUnique({
    where: { uuid: 'seed-project-website-redesign' },
  })

  const notesData: Array<any> = []
  if (alice) {
    notesData.push({
      uuid: 'seed-note-kickoff',
      title: 'Kickoff notes',
      description: 'Initial meeting notes and goals',
      body: 'Discuss timeline and deliverables.',
      status: NoteStatus.PUBLISHED,
      userId: alice.id,
      projectId: project?.id || null,
    })
  }

  const created: unknown[] = []
  for (const n of notesData) {
    const note = await prisma.note.upsert({
      where: { uuid: n.uuid },
      update: { title: n.title, description: n.description, body: n.body },
      create: n,
    })
    created.push(note)
  }

  return created
}
