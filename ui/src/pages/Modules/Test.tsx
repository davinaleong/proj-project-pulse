// pages/Dashboard/index.tsx
import ModuleLayout from "../../components/layout/ModuleLayout"
import Panel from "../../components/common/Panel"

function Test() {
  return (
    <ModuleLayout>
      <Panel title="Test" titleLevel={1} className="flow">
        <p>
          This page is use to test the appearance and functionality of the
          frontend UI.
        </p>
      </Panel>
    </ModuleLayout>
  )
}

export default Test
