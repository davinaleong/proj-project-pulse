import Panel from "../../components/Panel"
import "./Dashboard.css"

function Dashboard() {
  return (
    <Panel title="Dashboard" color="default">
      <div className="dashboard-placeholder">
        <p className="text-2xl font-semibold text-gray-700">
          Welcome to Project Pulse!
        </p>
        <p className="text-gray-600">
          This is your dashboard where you can monitor the health and status of
          your projects.
        </p>
      </div>
    </Panel>
  )
}

export default Dashboard
