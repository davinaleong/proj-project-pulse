// pages/Dashboard/index.tsx
import ModuleLayout from "../../components/layout/ModuleLayout"
import Panel from "../../components/common/Panel"
import Donut from "../../components/charts/Donut"
import Line from "../../components/charts/Line"
import StaticTable, { type Column } from "../../components/common/StaticTable"
import {
  personalProjects,
  type PersonalProject,
} from "../../data/demoPersonalProjects"

const personalProjectColumns: Column<PersonalProject>[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "uuid", label: "UUID" },
  { key: "priority", label: "Priority", sortable: true },
  { key: "beganAt", label: "Began At", sortable: true },
  { key: "completedAt", label: "Completed At", sortable: true },
  { key: "owner", label: "Owner", sortable: true },
  { key: "category", label: "Category", sortable: true },
]

function Dashboard() {
  // ✅ Only keep projects with priority >= 4
  const highPriorityProjects = personalProjects.filter(
    (proj) => proj.priority >= 4
  )

  return (
    <ModuleLayout>
      <Panel title="Dashboard" titleLevel={1} className="flow">
        <div className="grid grid-cols-3 gap-[1em]">
          <div className="flow">
            <h3 className="font-semibold text-xl">Donut Chart</h3>
            <Donut />
          </div>

          <StaticTable<PersonalProject>
            caption="High Priority Projects"
            columns={personalProjectColumns}
            data={highPriorityProjects}
            pageSize={10}
            color="danger"
          />

          <p>Table</p>
        </div>

        <h3 className="font-semibold text-xl">Line Chart</h3>
        <Line />
      </Panel>
    </ModuleLayout>
  )
}

export default Dashboard
