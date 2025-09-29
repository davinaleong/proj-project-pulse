import ModuleLayout from "../../components/layout/ModuleLayout"
import Panel from "../../components/common/Panel"
import StaticTable from "../../components/common/StaticTable"

function Test() {
  return (
    <ModuleLayout>
      <Panel title="Test" titleLevel={1} className="flow">
        <p>
          This page is use to test the appearance and functionality of the
          frontend UI.
        </p>

        <StaticTable
          columns={[
            { key: "id", label: "ID", sortable: true },
            { key: "name", label: "Name", sortable: true },
            { key: "email", label: "Email" },
          ]}
          data={[
            { id: 1, name: "Alice", email: "alice@example.com" },
            { id: 2, name: "Bob", email: "bob@example.com" },
            { id: 3, name: "Charlie", email: "charlie@example.com" },
          ]}
          enableSearch
          enablePagination
          sortable
          pageSize={2}
        />
      </Panel>
    </ModuleLayout>
  )
}

export default Test
