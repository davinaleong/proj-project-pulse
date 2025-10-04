import { useState } from "react"
import ModuleLayout from "../../components/layout/ModuleLayout"
import Panel from "../../components/common/Panel"
import Input from "../../components/forms/Input"
import TextArea from "../../components/forms/TextArea"
import NumericInput from "../../components/forms/NumericInput"
import ColorInput from "../../components/forms/ColorInput"
import DateTimePicker from "../../components/forms/DateTimeInput"
import Select from "../../components/forms/Select"
import StaticTable from "../../components/common/StaticTable"

function Test() {
  const [dateValue, setDateValue] = useState("")
  const [timeValue, setTimeValue] = useState("")
  const [dateTimeValue, setDateTimeValue] = useState("")

  return (
    <ModuleLayout>
      <Panel title="Test" titleLevel={1} className="flow">
        <p>
          This page is used to test the appearance and functionality of the
          frontend UI.
        </p>

        <Input label="Sample Input" name="name" placeholder="Name" />

        <TextArea
          label="Sample Text Area"
          name="comment"
          placeholder="Comment"
          rows={6}
        />

        {/* ✅ Select test */}
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

        {/* ✅ DateTimePicker test */}
        <div className="grid grid-cols-3 gap-[1em]">
          <DateTimePicker
            name="sampleDate"
            label="Pick a Date"
            variant="date"
            value={dateValue}
            onChange={setDateValue}
            message="Select a date"
            messageVariant="help"
          />

          <DateTimePicker
            name="sampleTime"
            label="Pick a Time"
            variant="time"
            value={timeValue}
            onChange={setTimeValue}
            message="Select a time"
            messageVariant="help"
          />

          <DateTimePicker
            name="sampleDateTime"
            label="Pick Date & Time"
            variant="datetime"
            value={dateTimeValue}
            onChange={setDateTimeValue}
            message="Select date and time"
            messageVariant="help"
          />
        </div>

        <NumericInput
          name="price"
          label="Price"
          value={1234.5}
          onChange={() => {}}
          decimalPlaces={2}
          useCommas={true}
          message="Enter an amount"
          messageVariant="help"
        />

        <ColorInput
          name="favColor"
          label="Pick a Color"
          value="#ff0000"
          format="rgba"
          onChange={(val, formats) => {
            console.log("Selected (preferred):", val)
            console.log("All formats:", formats)
          }}
          message="Pick your theme color"
          messageVariant="help"
        />

        {/* ✅ StaticTable test */}
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

        {/* Debug values */}
        <div className="mt-[1em] p-[1em] bg-gray-50 border rounded-sm text-sm">
          <pre>
            {JSON.stringify({ dateValue, timeValue, dateTimeValue }, null, 2)}
          </pre>
        </div>
      </Panel>
    </ModuleLayout>
  )
}

export default Test
