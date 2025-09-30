import ModuleLayout from "../../components/layout/ModuleLayout"
import Panel from "../../components/common/Panel"
import Input from "../../components/forms/Input"
import TextArea from "../../components/forms/TextArea"
import Select from "../../components/forms/Select"
import StaticTable from "../../components/common/StaticTable"

function Test() {
  return (
    <ModuleLayout>
      <Panel title="Test" titleLevel={1} className="flow">
        <p>
          This page is use to test the appearance and functionality of the
          frontend UI.
        </p>

        <Input label="Sample Input" name="name" placeholder="Name" />

        <TextArea
          label="Sample Text Area"
          name="comment"
          placeholder="Comment"
          rows={6}
        />

        <Select
          name="country"
          label="Country"
          options={[
            { value: "sg", label: "Singapore" },
            {
              label: "Europe",
              options: [
                { value: "fr", label: "France" },
                { value: "de", label: "Germany" },
              ],
            },
            { value: "us", label: "United States" },
          ]}
          value="sg"
          onChange={(e) => console.log(e.target.value)}
          searchable
          size={5}
          message="Pick your country"
          messageVariant="help"
        />

        <StaticTable
          caption="Sample Data Table"
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
