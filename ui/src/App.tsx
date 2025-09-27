import Dashboard from "./pages/Dashboard/Dashboard"
import Button from "./components/Button"
import ImgLogo from "./assets/images/logo-coloured-svg.svg"
import "./App.css"

function App() {
  return (
    <>
      <header>
        <Button
          variant="image"
          color="transparent"
          src={ImgLogo}
          onClick={() => {}}
        >
          <strong className="font-bold text-pp-slate-900">Project Pulse</strong>
        </Button>
      </header>
      <h1 className="text-6xl font-bold text-pp-slate-900">
        Project Pulse - UI
      </h1>
      <Dashboard />
    </>
  )
}

export default App
