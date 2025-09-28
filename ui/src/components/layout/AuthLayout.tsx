// AuthLayout.tsx
import Panel from "../common/Panel"
import Footer from "./Footer"

type AuthLayoutProps = {
  children: React.ReactNode
  year?: number
  company?: string
}

export default function AuthLayout({
  children,
  year = new Date().getFullYear(),
  company = "Davina Leong",
}: AuthLayoutProps) {
  return (
    <div className="grid place-items-center min-h-screen flow">
      <div className="flow">
        {/* Centered Panel */}
        <Panel className="w-full max-w-lg">{children}</Panel>

        {/* Footer */}
        <Footer className="w-full max-w-lg" year={year} company={company} />
      </div>
    </div>
  )
}
