import Main from './components/Main'

import AzureAiSearchLink from './components/AzureAiSearchLink'
import AzureOpenaiLink from './components/AzureOpenaiLink'

import Nav from "./components/Nav"
import StaticButton from './components/StaticButton'

export default function Home() {
  return (
    <Main>
      <div className="flow">
        <h2 className="text-center text-2xl font-bold">Welcome to Project Pulse AI</h2>

        <p className="text-center">A personal learning project built to showcase my skills in AI, data analytics, and dashboard design.<br/>
Powered by <AzureAiSearchLink /> and <AzureOpenaiLink />, this prototype demonstrates what I’ve learned during my BCG Business & Data Analytics course.</p>

        <Nav justifyContent="center">
          <StaticButton href="/chatbot" bgColor="bg-ppai-teal-500">AI Chatbot</StaticButton>
          <StaticButton href="/dashboard" bgColor="bg-ppai-teal-500">Interactive Dashboard</StaticButton>
        </Nav>
      </div>
    </Main>
  );
}
