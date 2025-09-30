// pages/Dashboard/index.tsx
import ModuleLayout from "../../components/layout/ModuleLayout"
import Panel from "../../components/common/Panel"
import Donut from "../../components/charts/Donut"
import Line from "../../components/charts/Line"
import StaticTable from "../../components/common/StaticTable"
import { demoProjects, type Project } from "../../data/demoProjects"

const columns: { key: keyof Project; label: string; sortable?: boolean }[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "name", label: "Project Name", sortable: true },
  { key: "owner", label: "Owner", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "priority", label: "Priority", sortable: true },
  { key: "dueDate", label: "Due Date", sortable: true },
]

function Dashboard() {
  return (
    <ModuleLayout>
      <Panel title="Dashboard" titleLevel={1} className="flow">
        <div className="grid grid-cols-3 gap-[1em]">
          <div className="flow">
            <h3 className="font-semibold text-xl">Donut Chart</h3>
            <Donut />
          </div>
          <StaticTable<Project>
            caption="High Priority Projects"
            columns={columns}
            data={demoProjects}
            enableSearch
            enablePagination
            sortable
            pageSize={3}
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
