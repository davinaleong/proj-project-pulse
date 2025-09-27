import Dashboard from "./pages/Dashboard/Dashboard"
import Button from "./components/Button"
import DropdownMenu from "./components/DropdownMenu"
import DropdownMenuItem from "./components/DropdownMenuItem"
import ImgLogo from "./assets/images/logo-coloured-svg.svg"
import "./App.css"

function App() {
  return (
    <>
      <header className="flex items-center justify-between">
        <Button
          variant="image"
          color="transparent"
          src={ImgLogo}
          onClick={() => {}}
        >
          <strong className="font-bold text-pp-slate-900">Project Pulse</strong>
        </Button>

        <DropdownMenu label="Modules" color="primary">
          <DropdownMenuItem variant="text" onClick={() => {}}>
            Projects
          </DropdownMenuItem>
          <DropdownMenuItem variant="text" onClick={() => {}}>
            Tasks
          </DropdownMenuItem>
          <DropdownMenuItem variant="text" onClick={() => {}}>
            Notes
          </DropdownMenuItem>
          <DropdownMenuItem variant="text" onClick={() => {}}>
            Activities
          </DropdownMenuItem>
          <DropdownMenuItem variant="text" onClick={() => {}}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem variant="text" onClick={() => {}}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem variant="text" onClick={() => {}}>
            Logout
          </DropdownMenuItem>
        </DropdownMenu>
      </header>
      <h1 className="text-6xl font-bold text-pp-slate-900">
        Project Pulse - UI
      </h1>
      <Dashboard />
    </>
  )
}

export default App
