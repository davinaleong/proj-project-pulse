import AzureAiSearchLink from './AzureAiSearchLink'
import AzureOpenaiLink from './AzureOpenaiLink'

export default function Footer() {
    return (
        <footer className="text-center flow">
          <p className="text-sm">Project Pulse AI &copy; Davina Leong, 2025. Powered by <AzureAiSearchLink /> and <AzureOpenaiLink />.</p>
        </footer>
    )
}