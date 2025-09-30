// demoProjects.ts
export type Project = {
  id: string
  name: string
  owner: string
  status: string
  priority: string
  dueDate: string
}

export const demoProjects: Project[] = [
  {
    id: "P-1001",
    name: "Migration to Cloud Infrastructure",
    owner: "Alice Tan",
    status: "In Progress",
    priority: "High",
    dueDate: "2025-10-15",
  },
  {
    id: "P-1002",
    name: "AI Chatbot for Customer Support",
    owner: "John Lee",
    status: "Planning",
    priority: "High",
    dueDate: "2025-11-01",
  },
  {
    id: "P-1003",
    name: "Cybersecurity Compliance Audit",
    owner: "Marcus Wong",
    status: "Pending Review",
    priority: "High",
    dueDate: "2025-10-20",
  },
  {
    id: "P-1004",
    name: "Water Quality Monitoring Dashboard",
    owner: "Nur Aisyah",
    status: "In Progress",
    priority: "High",
    dueDate: "2025-12-05",
  },
  {
    id: "P-1005",
    name: "Legacy System Decommissioning",
    owner: "Ryan Chen",
    status: "Blocked",
    priority: "High",
    dueDate: "2025-10-30",
  },
]
