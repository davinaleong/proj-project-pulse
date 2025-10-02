import ModuleLayout from "../../components/layout/ModuleLayout"
import Panel from "../../components/common/Panel"
import StaticTable, { type Column } from "../../components/common/StaticTable"
import {
  personalProjects,
  type PersonalProject,
} from "../../data/demoPersonalProjects"

const personalProjectColumns: Column<PersonalProject>[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "uuid", label: "UUID" },
  { key: "title", label: "Title" },
  { key: "priority", label: "Priority", sortable: true },
  { key: "beganAt", label: "Began At", sortable: true },
  { key: "completedAt", label: "Completed At", sortable: true },
  { key: "owner", label: "Owner", sortable: true },
  { key: "category", label: "Category", sortable: true },
]

function Projects() {
  return (
    <ModuleLayout>
      <Panel title="Projects">
        <StaticTable<PersonalProject>
          caption="All Projects"
          columns={personalProjectColumns}
          data={personalProjects}
          pageSize={30}
          enablePagination
          enableSearch
          bodyMaxHeight="600px"
        />
      </Panel>
    </ModuleLayout>
  )
}

export default Projects
