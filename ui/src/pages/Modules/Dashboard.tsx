// pages/Dashboard/index.tsx
import ModuleLayout from "../../components/layout/ModuleLayout"
import Panel from "../../components/common/Panel"
import Donut from "../../components/charts/Donut"
import Line from "../../components/charts/Line"

function Dashboard() {
  return (
    <ModuleLayout>
      <Panel title="Dashboard" titleLevel={1} className="flow">
        <div className="grid grid-cols-3 gap-[1em]">
          <div className="flow">
            <h3 className="font-semibold text-xl">Donut Chart</h3>
            <Donut />
          </div>
          <p>Table</p>
          <p>Table</p>
        </div>
        <h3 className="font-semibold text-xl">Line Chart</h3>
        <Line />
      </Panel>
    </ModuleLayout>
  )
}

export default Dashboard
