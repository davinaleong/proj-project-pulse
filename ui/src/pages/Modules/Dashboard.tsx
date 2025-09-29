// pages/Dashboard/index.tsx
import ModuleLayout from "../../components/layout/ModuleLayout"
import Panel from "../../components/common/Panel"

function DashboardPage() {
  return (
    <ModuleLayout>
      <Panel title="Dashboard" titleLevel={1} className="flow">
        <p className="text-gray-600">
          This is your dashboard. Modules and widgets will appear here.
        </p>
      </Panel>
    </ModuleLayout>
  )
}

export default DashboardPage
