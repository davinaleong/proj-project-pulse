import Header from "./components/Header"
import Dashboard from "./pages/Dashboard/Dashboard"
import "./App.css"

function App() {
  return (
    <>
      <Header />
      <h1 className="text-6xl font-bold text-pp-slate-900">
        Project Pulse - UI
      </h1>
      <Dashboard />
    </>
  )
}

export default App
