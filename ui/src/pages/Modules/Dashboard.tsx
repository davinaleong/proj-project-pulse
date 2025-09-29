// pages/Dashboard/index.tsx
import ModuleLayout from "../../components/layout/ModuleLayout"
import Panel from "../../components/common/Panel"
import Donut from "../../components/charts/Donut"

function Dashboard() {
  return (
    <ModuleLayout>
      <Panel title="Dashboard" titleLevel={1} className="flow">
        <div className="grid grid-cols-3 gap-[1em]">
          <Donut />
          <p>Table</p>
          <p>Table</p>
        </div>
        <p>Table</p>
      </Panel>
    </ModuleLayout>
  )
}

export default Dashboard
