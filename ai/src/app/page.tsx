import Header from './components/Header'
import Footer from './components/Footer'
import Container from "./components/Container"

import AzureAiSearchLink from './components/AzureAiSearchLink'
import AzureOpenaiLink from './components/AzureOpenaiLink'

import Nav from "./components/Nav"
import StaticButton from './components/StaticButton'

export default function Home() {
  return (
    <div className="font-sans bg-ppai-slate-50 text-ppai-slate-900">
      <Container className="min-h-screen py-4 h-full flex flex-col">
        <Header />

        <div className="flex-1 flex items-center justify-center">
          <div className="flow">
            <h2 className="text-center text-2xl font-bold">Welcome to Project Pulse AI</h2>

            <p className="text-center">A personal learning project built to showcase my skills in AI, data analytics, and dashboard design.<br/>
Powered by <AzureAiSearchLink /> and <AzureOpenaiLink />, this prototype demonstrates what I’ve learned during my BCG Business & Data Analytics course.</p>

            <Nav justifyContent="center">
              <StaticButton href="/chatbot" bgColor="bg-ppai-teal-500">AI Chatbot</StaticButton>
              <StaticButton href="/dashboard" bgColor="bg-ppai-teal-500">Interactive Dashboard</StaticButton>
           </Nav>
          </div>
        </div>

        <Footer />
      </Container>
    </div>
  );
}
