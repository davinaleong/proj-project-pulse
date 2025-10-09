import { PrismaClient } from '@prisma/client'

export async function seedSettings(prisma: PrismaClient) {
  const alice = await prisma.user.findUnique({
    where: { email: 'alice@example.com' },
  })

  const settingsData: Array<unknown> = []
  if (alice) {
    settingsData.push({
      key: 'dashboard:show_completed',
      value: 'false',
      type: 'boolean',
      userId: alice.id,
    })
  }
  settingsData.push({
    key: 'system:default_currency',
    value: 'SGD',
    type: 'string',
  })

  const created: unknown[] = []
  type SettingSeed = {
    key: string
    value: string
    type?: string
    userId?: string
  }
  for (const s of settingsData as SettingSeed[]) {
    const setting = await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, type: s.type },
      create: s,
    })
    created.push(setting)
  }

  return created
}
