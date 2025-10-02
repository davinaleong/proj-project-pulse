import { Plus } from "lucide-react"
import ModuleLayout from "../../../components/layout/ModuleLayout"
import Button from "../../../components/common/Button"
import Panel from "../../../components/common/Panel"
import StaticTable, {
  type Column,
} from "../../../components/common/StaticTable"
import {
  personalProjects,
  type PersonalProject,
} from "../../../data/demoPersonalProjects"

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

function Index() {
  return (
    <ModuleLayout>
      <Panel title="Projects">
        <div className="flow">
          <p className="flex gap-[1em] items-center">
            <Button
              type="button"
              variant="text"
              icon={Plus}
              iconPosition="left"
              onClick={() => {}}
            >
              Create
            </Button>
            <span>
              a new <strong>Project</strong>.
            </span>
          </p>
          <StaticTable<PersonalProject>
            caption="All Projects"
            columns={personalProjectColumns}
            data={personalProjects}
            pageSize={30}
            enablePagination
            enableSearch
            bodyMaxHeight="600px"
          />
        </div>
      </Panel>
    </ModuleLayout>
  )
}

export default Index
