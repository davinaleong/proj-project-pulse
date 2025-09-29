// pages/Dashboard/index.tsx
import ModuleLayout from "../../components/layout/ModuleLayout"
import Panel from "../../components/common/Panel"
import Donut from "../../components/charts/Donut"

function DashboardPage() {
  return (
    <ModuleLayout>
      <Panel title="Dashboard" titleLevel={1} className="flow">
        <div className="grid grid-cols-3 gap-[1em]">
          <Donut />
          <Donut />
          <Donut />
        </div>
      </Panel>
    </ModuleLayout>
  )
}

export default DashboardPage
