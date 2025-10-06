import { useState } from "react"
import {
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
} from "lucide-react"
import ModuleLayout from "../../components/layout/ModuleLayout"
import Panel from "../../components/common/Panel"
import Card from "../../components/common/Card"
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
import IconButton from "../../components/common/IconButton"
import AvatarBadge from "../../components/common/AvatarBadge"
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

        {/* 1️⃣ Basic default card */}
        <Card title="Default Card" footer="Footer text here">
          <p>This is a simple card with default color and a footer.</p>
        </Card>

        {/* 2️⃣ Color variants */}
        <div className="grid md:grid-cols-3 gap-[1em]">
          <Card title="Primary" color="primary">
            <p>Primary variant for general emphasis.</p>
          </Card>
          <Card
            title="Danger"
            color="danger"
            icon={<XCircle />}
            iconPosition="left"
          >
            <p>Danger variant with left icon.</p>
          </Card>
          <Card
            title="Success"
            color="success"
            icon={<CheckCircle />}
            iconPosition="right"
          >
            <p>Success variant with right icon.</p>
          </Card>
        </div>

        {/* 3️⃣ Expandable card */}
        <Card
          title="Expandable Info"
          color="info"
          expandable
          defaultOpen={true}
          icon={<Info />}
          iconPosition="left"
          footer="Last updated 2 hours ago"
          className="flow"
        >
          <p>
            This card can be expanded or collapsed. Try clicking the arrow in
            the header.
          </p>
          <p>It demonstrates controlled state for showing/hiding content.</p>
        </Card>

        {/* 4️⃣ Top & Bottom Icon positions */}
        <div className="grid md:grid-cols-2 gap-[1em]">
          <Card
            title="Top Icon"
            color="warning"
            icon={<AlertTriangle />}
            iconPosition="top"
          >
            <p>Icon is placed above the content.</p>
          </Card>
          <Card
            title="Bottom Icon"
            color="secondary"
            icon={<ChevronRight />}
            iconPosition="bottom"
          >
            <p>Icon is placed below the content.</p>
          </Card>
        </div>

        {/* 5️⃣ Image + content combination */}
        <Card
          title="Card with Images"
          color="default"
          imageTop={<img src="https://picsum.photos/600/200" alt="Top" />}
          imageBottom={<img src="https://picsum.photos/600/150" alt="Bottom" />}
          footer="Images have no padding and span full width."
        >
          <p>
            This card showcases both top and bottom images with content in the
            middle.
          </p>
        </Card>

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

        <div className="flex gap-[1em]">
          <IconButton icon={Edit} color="primary" tooltip="Edit item" />
          <IconButton icon={Trash2} color="danger" tooltip="Delete item" />
          <IconButton icon={Plus} color="success" tooltip="Add new" />
        </div>

        <div className="flex gap-[1em] items-center">
          {/* With image */}
          <AvatarBadge
            name="Davina Leong"
            imageUrl="https://i.pravatar.cc/100?img=5"
            color="primary"
          />

          {/* With initials */}
          <AvatarBadge name="John Tan" color="success" />

          {/* Anonymous with random Lucide icon */}
          <AvatarBadge color="secondary" />

          {/* Custom size */}
          <AvatarBadge name="Adele Foo" color="warning" size={64} />
        </div>

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
