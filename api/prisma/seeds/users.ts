import { PrismaClient, UserRole, UserStatus, Theme, Visibility } from '@prisma/client'

export async function seedUsers(prisma: PrismaClient) {
  // Create a couple of users with profiles. Passwords are plain for seeds.
  const usersData = [
    {
      name: 'Alice Example',
      email: 'alice@example.com',
      password: 'password',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          bio: 'Product manager and project lead.',
          avatarUrl: null,
          timezone: 'Asia/Singapore',
          language: 'en',
          theme: Theme.LIGHT,
          visibility: Visibility.PUBLIC,
        },
      },
    },
    {
      name: 'Bob Developer',
      email: 'bob@example.com',
      password: 'password',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          bio: 'Frontend engineer focused on UX and performance.',
          timezone: 'Asia/Singapore',
          language: 'en',
          theme: Theme.DARK,
          visibility: Visibility.PUBLIC,
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
      create: u,
    })
    created.push(user)
  }

  return created
}
