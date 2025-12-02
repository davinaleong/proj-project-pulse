import Link from "next/link"

import Header from './components/Header'
import Container from "./components/Container"

export default function Home() {
  return (
    <div className="font-sans bg-ppai-slate-50 text-ppai-slate-900">
      <Container className="min-h-screen py-4 h-full flex flex-col">
        <Header />

        <div className="flex-1 flex items-center justify-center">
          Navigation here  
        </div>

        <footer className="text-center flow">
          <p className="text-sm">Project Pulse AI &copy; Davina Leong, 2025. Powered by <Link href="https://azure.microsoft.com/en-us/services/cognitive-search/" target="_blank">Azure AI Search</Link> and <Link href="https://azure.microsoft.com/en-us/products/ai-foundry/models/openai" target="_blank">Azure Open AI</Link>.</p>
        </footer>
      </Container>
    </div>
  );
}
