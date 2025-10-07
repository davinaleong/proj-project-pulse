// ModuleLayout.tsx
import Header from "./Header"
import Footer from "./Footer"
import ChatBot from "./../chat/ChatBot"

type ModuleLayoutProps = {
  children: React.ReactNode
}

function ModuleLayout({ children }: ModuleLayoutProps) {
  return (
    <div className="relative flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flow py-[1em]">{children}</main>
      <Footer year={2025} company="Davina Leong" />

      <ChatBot />
    </div>
  )
}

export default ModuleLayout
