import { useState } from "react"
import ModuleLayout from "../../components/layout/ModuleLayout"
import Panel from "../../components/common/Panel"
import Input from "../../components/forms/Input"
import TextArea from "../../components/forms/TextArea"
import NumericInput from "../../components/forms/NumericInput"
import ColorInput from "../../components/forms/ColorInput"
import EmailInput from "../../components/forms/EmailInput"
import PasswordInput from "../../components/forms/PasswordInput"
import DateTimeInput from "../../components/forms/DateTimeInput"
import Select from "../../components/forms/Select"
import HumanCheckInput from "../../components/forms/HumanCheckInput"
import LightSwitchInput from "../../components/forms/LightSwitchInput"
import RadioGroup from "../../components/forms/RadioGroup"
import CheckboxGroup from "../../components/forms/CheckboxGroup"
import RatingInput from "../../components/forms/RatingInput"
import StaticTable from "../../components/common/StaticTable"
import DataGrid, { type DataGridColumn } from "../../components/common/DataGrid"
import {
  personalProjects,
  type PersonalProject,
} from "../../data/demoPersonalProjects"

function Test() {
  const columns: DataGridColumn<PersonalProject>[] = [
    { key: "id", label: "ID", type: "number", sortable: true },
    { key: "uuid", label: "UUID", type: "text" },
    {
      key: "title",
      label: "Title",
      type: "text",
      sortable: true,
      required: true,
    },
    {
      key: "priority",
      label: "Priority",
      type: "number",
      editable: true,
      sortable: true,
    },
    {
      key: "beganAt",
      label: "Began At",
      type: "date",
      editable: true,
      sortable: true,
    },
    {
      key: "completedAt",
      label: "Completed At",
      type: "date",
      editable: true,
      sortable: true,
    },
    { key: "owner", label: "Owner", type: "text", editable: true },
    {
      key: "category",
      label: "Category",
      type: "text",
      editable: true,
      sortable: true,
    },
  ]

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
          <DateTimeInput
            name="sampleDate"
            label="Pick a Date"
            variant="date"
            value={dateValue}
            onChange={setDateValue}
            message="Select a date"
            messageVariant="help"
          />

          <DateTimeInput
            name="sampleTime"
            label="Pick a Time"
            variant="time"
            value={timeValue}
            onChange={setTimeValue}
            message="Select a time"
            messageVariant="help"
          />

          <DateTimeInput
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

        <EmailInput
          label="Work Email"
          name="email"
          required
          rules="whitelist"
          allowedDomains={["gmail.com", "outlook.com"]}
          message="Please enter your preferred email"
          messageVariant="help"
          onChange={(val, valid) => console.log("Email:", val, "Valid:", valid)}
        />

        <PasswordInput
          label="Password"
          name="password"
          required
          convention="strong"
          showConfirmation
          message="Use a strong password for better security"
          onChange={(val, valid) =>
            console.log("Password:", val, "Valid:", valid)
          }
          onConfirmChange={(val, match) =>
            console.log("Confirm:", val, "Match:", match)
          }
        />

        <HumanCheckInput
          label="I am not a robot 🤖"
          message="Just confirming you're human!"
          messageVariant="help"
          onChange={(checked) => console.log("Human check:", checked)}
        />

        <div className="flex gap-[0.5em] items-center">
          <LightSwitchInput
            name="notifications"
            labelLeft="Off"
            labelRight="On"
            variant="boolean"
            color="primary"
            onChange={(v) => console.log("Boolean value:", v)}
          />

          <LightSwitchInput
            name="marketingConsent"
            labelRight="Allow Marketing Emails"
            variant="accepted"
            color="success"
            onChange={(v) => console.log("Accepted variant:", v)}
          />

          <LightSwitchInput
            name="darkMode"
            labelLeft="Light"
            labelRight="Dark"
            variant="text"
            color="info"
            onChange={(v) => console.log("Text variant:", v)}
          />
        </div>

        <RadioGroup
          name="priority"
          label="Select Priority Level"
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
          defaultValue="medium"
          color="primary"
          onChange={(val) => console.log("Selected:", val)}
        />

        <CheckboxGroup
          name="features"
          label="Select Features"
          options={[
            { value: "analytics", label: "Analytics" },
            { value: "backup", label: "Automatic Backup" },
            { value: "darkmode", label: "Dark Mode" },
          ]}
          defaultValue={["backup"]}
          color="primary"
          onChange={(vals) => console.log("Checked:", vals)}
        />

        <RatingInput
          name="usability"
          label="Rate usability"
          steps={5}
          variant="stars"
          allowReset
          color="success"
          onChange={(val) => console.log("Rating:", val)}
        />

        <RatingInput
          name="mood"
          label="How do you feel?"
          steps={3}
          variant="smiley"
          color="warning"
        />

        <RatingInput
          name="accuracy"
          label="Rate accuracy"
          steps={10}
          variant="circle"
          color="info"
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

        <DataGrid<PersonalProject>
          caption="Tech Projects"
          columns={columns}
          data={personalProjects}
          pageSize={10}
          color="default"
          onSave={(updated) => console.log("✅ Updated Projects:", updated)}
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
