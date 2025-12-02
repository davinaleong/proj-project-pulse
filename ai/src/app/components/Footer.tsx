import Link from "next/link"

export default function Footer() {
    return (
        <footer className="text-center flow">
          <p className="text-sm">Project Pulse AI &copy; Davina Leong, 2025. Powered by <Link href="https://azure.microsoft.com/en-us/services/cognitive-search/" className="anchor" target="_blank">Azure AI Search</Link> and <Link href="https://azure.microsoft.com/en-us/products/ai-foundry/models/openai" className="anchor" target="_blank">Azure Open AI</Link>.</p>
        </footer>
    )
}