// data/demoPersonalProjects.ts
import { v4 as uuidv4 } from "uuid"
import dayjs from "dayjs"

export type PersonalProject = {
  id: number
  uuid: string
  title: string
  priority: number // 1 = low, 5 = high
  beganAt: string
  completedAt: string
  owner: string
  category: string
}

const categories = [
  "Web Development",
  "Mobile App",
  "Data Science",
  "Machine Learning",
  "Game Development",
  "UI/UX",
  "Automation",
  "IoT",
  "Blockchain",
  "DevOps",
]

const titles = [
  "Portfolio Website",
  "E-commerce Store",
  "Chat Application",
  "Fitness Tracker",
  "Weather Dashboard",
  "Stock Analyzer",
  "Blog CMS",
  "Task Manager",
  "Expense Tracker",
  "Recipe Finder",
  "Music Player",
  "Social Media Clone",
  "Note Taking App",
  "AI Image Classifier",
  "Language Learning App",
  "Personal Wiki",
  "Crypto Tracker",
  "Video Sharing App",
  "AR Demo Project",
  "Smart Home Controller",
]

function randomDate(startYear = 2015, endYear = 2025) {
  const start = dayjs(`${startYear}-01-01`).valueOf()
  const end = dayjs(`${endYear}-12-31`).valueOf()
  return dayjs(start + Math.random() * (end - start))
}

export const personalProjects: PersonalProject[] = Array.from(
  { length: 50 },
  (_, i) => {
    const beganAt = randomDate()
    const completedAt = randomDate(beganAt.year(), 2025)

    return {
      id: i + 1,
      uuid: uuidv4(),
      title: titles[Math.floor(Math.random() * titles.length)],
      priority: Math.floor(Math.random() * 5) + 1,
      beganAt: beganAt.toISOString(),
      completedAt: completedAt.toISOString(),
      owner: "Davina Leong",
      category: categories[Math.floor(Math.random() * categories.length)],
    }
  }
)
