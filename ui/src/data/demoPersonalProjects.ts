import { v4 as uuidv4 } from "uuid"
import dayjs from "dayjs"

export type PersonalProject = {
  id: number
  uuid: string
  priority: number
  beganAt: string
  completedAt: string
  owner: string
  category: string
}

// Categories pool
const categories: string[] = [
  "Web Development",
  "Machine Learning",
  "Mobile Apps",
  "Data Science",
  "UI/UX Design",
  "Cybersecurity",
  "DevOps",
  "AI Research",
  "Cloud Computing",
  "Game Development",
  "IoT",
  "Blockchain",
  "AR/VR",
  "Database Systems",
  "Automation",
]

// ✅ Random dayjs date between two dayjs dates
function randomDayjs(start: dayjs.Dayjs, end: dayjs.Dayjs): dayjs.Dayjs {
  const diff = end.valueOf() - start.valueOf()
  const offset = Math.floor(Math.random() * diff)
  return dayjs(start.valueOf() + offset)
}

// ✅ Generate 50 projects
export const personalProjects: PersonalProject[] = Array.from(
  { length: 50 },
  (_, i) => {
    const beganAt = randomDayjs(dayjs("2015-01-01"), dayjs("2025-01-01"))
    const completedAt = randomDayjs(beganAt, dayjs("2025-12-31"))

    return {
      id: i + 1,
      uuid: uuidv4(),
      priority: Math.floor(Math.random() * 5) + 1, // 1–5
      beganAt: beganAt.toISOString(),
      completedAt: completedAt.toISOString(),
      owner: "Davina Leong",
      category: categories[Math.floor(Math.random() * categories.length)],
    }
  }
)
