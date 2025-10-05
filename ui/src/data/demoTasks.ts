import { v4 as uuidv4 } from "uuid"
import dayjs from "dayjs"
import { personalProjects } from "./demoPersonalProjects"

export type TaskStatus =
  | "Backlog"
  | "TODO"
  | "WIP"
  | "Done"
  | "On-hold"
  | "Blocked"

export type Task = {
  id: number
  uuid: string
  projectId: string
  title: string
  status: TaskStatus
  startedAt: string
  endedAt: string
  durationHours: number
  costInUSD: number
  assignee: string
}

/**
 * Utility: generate a random dayjs date between startYear and endYear.
 */
function randomDate(startYear = 2020, endYear = 2025) {
  const start = dayjs(`${startYear}-01-01`).valueOf()
  const end = dayjs(`${endYear}-12-31`).valueOf()
  return dayjs(start + Math.random() * (end - start))
}

/**
 * Utility: pick a random item from an array.
 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const statuses: TaskStatus[] = [
  "Backlog",
  "TODO",
  "WIP",
  "Done",
  "On-hold",
  "Blocked",
]

const taskTitles = [
  "Design database schema",
  "Implement user login",
  "Build REST API",
  "Create landing page",
  "Write unit tests",
  "Optimize performance",
  "Integrate payment gateway",
  "Fix UI bugs",
  "Refactor components",
  "Write API documentation",
  "Deploy to staging",
  "Code review and merge",
  "Setup CI/CD pipeline",
  "Conduct user testing",
  "Prepare project report",
  "Add analytics tracking",
  "Update README",
  "Resolve merge conflicts",
  "Improve accessibility",
  "Implement dark mode",
]

// Anonymous fictional assignees
const assignees = [
  "Alex Rivera",
  "Jamie Chen",
  "Taylor Morgan",
  "Jordan Patel",
  "Casey Tan",
  "Riley Wong",
  "Avery Lim",
  "Sam Yu",
  "Cameron Lee",
  "Morgan Ong",
]

/**
 * Demo dataset: generate 100 tasks with realistic timestamps, durations, and costs,
 * linked to existing personal projects.
 */
export const demoTasks: Task[] = Array.from({ length: 100 }, (_, i) => {
  const project = randomPick(personalProjects)
  const start = randomDate(dayjs(project.beganAt).year(), 2025)
  const end = start.add(Math.floor(Math.random() * 14) + 1, "day")

  const durationHours = Math.floor(Math.random() * 80) + 4 // 4–84 hours
  const hourlyRate = 35 + Math.random() * 45 // $35–$80/hr
  const costInUSD = parseFloat((durationHours * hourlyRate).toFixed(2))

  return {
    id: i + 1,
    uuid: uuidv4(),
    projectId: project.uuid,
    title: randomPick(taskTitles),
    status: randomPick(statuses),
    startedAt: start.toISOString(),
    endedAt: end.toISOString(),
    durationHours,
    costInUSD,
    assignee: randomPick(assignees),
  }
})
