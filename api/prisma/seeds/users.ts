import { PrismaClient } from '@prisma/client'

export async function seedUsers(prisma: PrismaClient) {
  // Create a couple of users with profiles. Passwords are plain for seeds.
  const usersData = [
    {
      name: 'Alice Example',
      email: 'alice@example.com',
      password: 'password',
      role: 'ADMIN',
      status: 'ACTIVE',
      profile: {
        create: {
          bio: 'Product manager and project lead.',
          avatarUrl: null,
          timezone: 'Asia/Singapore',
          language: 'en',
          theme: 'LIGHT',
          visibility: 'PUBLIC',
        },
      },
    },
    {
      name: 'Bob Developer',
      email: 'bob@example.com',
      password: 'password',
      role: 'USER',
      status: 'ACTIVE',
      profile: {
        create: {
          bio: 'Frontend engineer focused on UX and performance.',
          timezone: 'Asia/Singapore',
          language: 'en',
          theme: 'DARK',
          visibility: 'PUBLIC',
        },
      },
    },
  ]

  const created: unknown[] = []
  for (const u of usersData) {
    // Upsert so running seeds multiple times is safe-ish in development.
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        status: u.status,
        password: u.password,
      },
      create: u as unknown,
    })
    created.push(user)
  }

  return created
}
