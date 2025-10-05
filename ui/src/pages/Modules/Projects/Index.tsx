import { Plus, Eye, Pencil, Trash2 } from "lucide-react"
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
  { key: "actions", label: "Actions" },
]

function Index() {
  // Action handlers
  const handleView = (uuid: string) => {
    console.log("View record:", uuid)
  }

  const handleEdit = (uuid: string) => {
    console.log("Edit record:", uuid)
  }

  const handleDelete = (uuid: string) => {
    if (confirm("Are you sure you want to delete this record?")) {
      console.log("Deleted record:", uuid)
    }
  }

  // Enrich data with actions
  const projectDataWithActions = personalProjects.map((p) => ({
    ...p,
    actions: (
      <div className="flex gap-[0.25em] justify-center">
        <Button
          variant="icon"
          color="info"
          icon={Eye}
          onClick={() => handleView(p.uuid)}
        />
        <Button
          variant="icon"
          color="primary"
          icon={Pencil}
          onClick={() => handleEdit(p.uuid)}
        />
        <Button
          variant="icon"
          color="danger"
          icon={Trash2}
          onClick={() => handleDelete(p.uuid)}
        />
      </div>
    ),
  }))

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

          <StaticTable<PersonalProject & { actions: JSX.Element }>
            caption="All Projects"
            columns={personalProjectColumns}
            data={projectDataWithActions}
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
