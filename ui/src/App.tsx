import Header from "./components/Header"
import Footer from "./components/Footer"
import Dashboard from "./pages/Dashboard/Dashboard"
import "./App.css"

function App() {
  return (
    <main className="flow">
      <Header />
      <Dashboard />
      <Footer year={2025} company="Davina Leong" />
    </main>
  )
}

export default App
