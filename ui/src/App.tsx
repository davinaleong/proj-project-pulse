import Header from "./components/Header"
import Footer from "./components/Footer"
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
      <Footer year={2025} company="Davina Leong" />
    </>
  )
}

export default App
