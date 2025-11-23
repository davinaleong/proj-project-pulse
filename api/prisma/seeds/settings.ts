import { PrismaClient } from '@prisma/client'

export async function seedSettings(prisma: PrismaClient) {
  const alice = await prisma.user.findUnique({
    where: { email: 'alice@example.com' },
  })

  const settingsData: Array<any> = []
  if (alice) {
    settingsData.push({
      uuid: 'seed-setting-dashboard-show-completed',
      key: 'dashboard:show_completed',
      value: 'false',
      type: 'boolean',
      userId: alice.id,
    })
  }
  settingsData.push({
    uuid: 'seed-setting-system-default-currency',
    key: 'system:default_currency',
    value: 'SGD',
    type: 'string',
  })

  const created: unknown[] = []
  for (const s of settingsData) {
    const setting = await prisma.setting.upsert({
      where: { uuid: s.uuid },
      update: { key: s.key, value: s.value, type: s.type },
      create: s,
    })
    created.push(setting)
  }

  return created
}
